"""
Booking State Machine — strict state enforcement to prevent duplicate or invalid bookings.
"""

VALID_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["reminded", "rescheduled", "cancelled", "completed", "no_show"],
    "reminded": ["rescheduled", "cancelled", "completed", "no_show"],
    "rescheduled": ["reminded", "cancelled", "completed", "no_show"],
    "completed": ["review_sent"],
    "review_sent": [],
    "cancelled": [],
    "no_show": [],
}


class InvalidTransitionError(Exception):
    pass


def validate_transition(current_state: str, new_state: str) -> None:
    if new_state not in VALID_TRANSITIONS.get(current_state, []):
        raise InvalidTransitionError(
            f"Cannot transition booking from '{current_state}' to '{new_state}'"
        )
