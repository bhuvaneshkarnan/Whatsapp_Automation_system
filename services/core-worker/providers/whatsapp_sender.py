"""
WhatsApp sender — sends messages using the client's own phone number ID and access token.
Each client has their own official WhatsApp Business number.
"""
import httpx
import structlog

logger = structlog.get_logger()

GRAPH_API_VERSION = "v19.0"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


class WhatsAppSendError(Exception):
    pass


async def send_text(
    phone_number_id: str,
    access_token: str,
    to: str,
    body: str,
    timeout: float = 10.0,
) -> str:
    """
    Send a plain text message using the client's official WhatsApp number.

    Args:
        phone_number_id: Client's Meta Phone Number ID (from tenant_credentials)
        access_token:    Client's Meta Access Token (permanent system user token)
        to:              Recipient phone in E.164 format (e.g. +919876543210)
        body:            Message text
        timeout:         HTTP timeout in seconds

    Returns:
        wa_message_id of the sent message
    """
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"preview_url": False, "body": body},
    }

    return await _send(phone_number_id, access_token, payload, timeout)


async def send_template(
    phone_number_id: str,
    access_token: str,
    to: str,
    template_name: str,
    language_code: str,
    components: list[dict],
    timeout: float = 10.0,
) -> str:
    """
    Send a WhatsApp approved template message.
    Required for reaching customers outside the 24-hour session window.
    Automatically adapts parameter count if Meta template expects 2, 3, or 4 parameters.
    """
    clean_to = to.replace("+", "").replace(" ", "").replace("-", "").strip()
    payload = {
        "messaging_product": "whatsapp",
        "to": clean_to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code},
            "components": components,
        },
    }

    try:
        return await _send(phone_number_id, access_token, payload, timeout)
    except WhatsAppSendError as e:
        err_str = str(e)
        if "132000" in err_str and "expected number of params" in err_str:
            import re
            m = re.search(r'expected number of params \((\d+)\)', err_str)
            if m:
                expected_count = int(m.group(1))
                logger.info("retrying_template_with_adapted_param_count", template=template_name, expected=expected_count)
                if components and len(components) > 0 and "parameters" in components[0]:
                    current_params = components[0]["parameters"]
                    if expected_count < len(current_params):
                        # Merge trailing params into the last param if needed, or slice
                        adapted_params = current_params[:expected_count]
                        payload["template"]["components"][0]["parameters"] = adapted_params
                        return await _send(phone_number_id, access_token, payload, timeout)
                    elif expected_count == 3 and len(current_params) >= 4:
                        # e.g. Name, Service, "Time on Date"
                        p1 = current_params[0]["text"]
                        p2 = current_params[1]["text"]
                        p3 = f"{current_params[3]['text']} on {current_params[2]['text']}" if len(current_params) > 3 else current_params[2]["text"]
                        payload["template"]["components"][0]["parameters"] = [
                            {"type": "text", "text": p1},
                            {"type": "text", "text": p2},
                            {"type": "text", "text": p3},
                        ]
                        return await _send(phone_number_id, access_token, payload, timeout)
        raise e


async def send_interactive_buttons(
    phone_number_id: str,
    access_token: str,
    to: str,
    body_text: str,
    buttons: list[dict],  # [{"id": "btn1", "title": "Confirm"}]
    timeout: float = 10.0,
) -> str:
    """Send a message with quick-reply buttons (for booking confirmations, etc.)."""
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body_text},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
                    for b in buttons[:3]  # Max 3 buttons per WhatsApp spec
                ]
            },
        },
    }

    return await _send(phone_number_id, access_token, payload, timeout)


async def mark_as_read(
    phone_number_id: str,
    access_token: str,
    wa_message_id: str,
) -> None:
    """Mark an inbound message as read (shows double blue ticks to sender)."""
    async with httpx.AsyncClient(timeout=5) as client:
        await client.post(
            f"{GRAPH_BASE}/{phone_number_id}/messages",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "messaging_product": "whatsapp",
                "status": "read",
                "message_id": wa_message_id,
            },
        )


async def _send(
    phone_number_id: str,
    access_token: str,
    payload: dict,
    timeout: float,
) -> str:
    """Core send function — posts to Meta Graph API."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{GRAPH_BASE}/{phone_number_id}/messages",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.TimeoutException:
        raise WhatsAppSendError(f"WhatsApp API timeout after {timeout}s")
    except httpx.RequestError as e:
        raise WhatsAppSendError(f"WhatsApp API request error: {e}")

    if response.status_code not in (200, 201):
        raise WhatsAppSendError(
            f"WhatsApp API error {response.status_code}: {response.text[:300]}"
        )

    data = response.json()
    wa_message_id = data.get("messages", [{}])[0].get("id", "")
    logger.info("wa_message_sent", wa_message_id=wa_message_id, to=payload.get("to", "")[-4:])
    return wa_message_id
