'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Star,
  QrCode,
  ShieldCheck,
  Palette,
  FileText
} from 'lucide-react';

interface QrStandeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantName?: string;
  tenantSlug?: string;
  gmbReviewUrl?: string;
  customDomain?: string;
}

export default function QrStandeeModal({
  isOpen,
  onClose,
  tenantName = 'Our Business',
  tenantSlug = 'business',
  gmbReviewUrl = '',
  customDomain = '',
}: QrStandeeModalProps) {
  const [targetType, setTargetType] = useState<'smart' | 'direct'>('smart');
  const [template, setTemplate] = useState<'google_classic' | 'modern_dark' | 'table_tent'>('google_classic');
  const [businessName, setBusinessName] = useState(tenantName);
  const [headline, setHeadline] = useState('Review Us On Google');
  const [subtext, setSubtext] = useState('Scan with your phone camera to share your feedback in 10 seconds!');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (tenantName) setBusinessName(tenantName);
  }, [tenantName]);

  const origin = typeof window !== 'undefined' 
    ? (customDomain ? `https://${customDomain.replace(/^https?:\/\//, '')}` : window.location.origin) 
    : 'https://ai.bizpipe.in';

  const cleanSlug = tenantSlug || 'review';
  const smartUrl = `${origin}/${cleanSlug}/review`;
  const directUrl = (gmbReviewUrl || '').trim();
  const effectiveTargetUrl = (targetType === 'direct' && directUrl) ? directUrl : smartUrl;

  useEffect(() => {
    if (!effectiveTargetUrl) return;
    let isMounted = true;

    async function generateCodes() {
      try {
        const pngUrl = await QRCode.toDataURL(effectiveTargetUrl, {
          width: 1024,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: {
            dark: template === 'modern_dark' ? '#0f172a' : '#000000',
            light: '#ffffff',
          },
        });
        const svgString = await QRCode.toString(effectiveTargetUrl, {
          type: 'svg',
          margin: 1,
          errorCorrectionLevel: 'H',
        });
        if (isMounted) {
          setQrDataUrl(pngUrl);
          setQrSvg(svgString);
        }
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    }

    generateCodes();
    return () => {
      isMounted = false;
    };
  }, [effectiveTargetUrl, template]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(effectiveTargetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-Standee-${cleanSlug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-Standee-${cleanSlug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintStandee = () => {
    if (!qrDataUrl) return;
    setIsPrinting(true);

    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) {
      alert('Please allow popups to open the print dialog.');
      setIsPrinting(false);
      return;
    }

    let cardContent = '';

    if (template === 'table_tent') {
      const renderPanel = () => `
        <div class="panel">
          <div class="google-header">
            <svg class="google-logo" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.57H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.43l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.15c.95-2.83 3.6-4.97 6.72-4.97z"/>
            </svg>
            <span class="google-title">Google Reviews</span>
          </div>

          <div class="stars">★★★★★</div>
          <h2 class="headline">${headline}</h2>
          <div class="business-name">${businessName}</div>

          <div class="qr-frame">
            <img src="${qrDataUrl}" alt="QR Code" class="qr-img" />
          </div>

          <div class="instructions">
            <div class="step"><span>1</span> Open Camera</div>
            <div class="step"><span>2</span> Scan QR</div>
            <div class="step"><span>3</span> Rate 5-Stars</div>
          </div>

          <p class="subtext">${subtext}</p>
        </div>
      `;

      cardContent = `
        <div class="table-tent-container">
          ${renderPanel()}
          <div class="fold-line">
            <span>--- FOLD HERE (TABLE TENT) ---</span>
          </div>
          ${renderPanel()}
        </div>
      `;
    } else if (template === 'modern_dark') {
      cardContent = `
        <div class="standee-card dark-mode">
          <div class="google-header">
            <svg class="google-logo" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.57H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.43l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.15c.95-2.83 3.6-4.97 6.72-4.97z"/>
            </svg>
            <span class="google-title">Google Rating</span>
          </div>

          <div class="stars gold">★★★★★</div>
          <h1 class="headline">${headline}</h1>
          <div class="business-name gold-text">${businessName}</div>

          <div class="qr-frame light-frame">
            <img src="${qrDataUrl}" alt="QR Code" class="qr-img" />
          </div>

          <div class="instructions dark-instructions">
            <div class="step"><span>1</span> Open Camera</div>
            <div class="step"><span>2</span> Scan Code</div>
            <div class="step"><span>3</span> Rate Us</div>
          </div>

          <p class="subtext">${subtext}</p>
          <div class="footer-badge">Thank you for your business!</div>
        </div>
      `;
    } else {
      cardContent = `
        <div class="standee-card">
          <div class="google-header">
            <svg class="google-logo" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.57H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.43l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.15c.95-2.83 3.6-4.97 6.72-4.97z"/>
            </svg>
            <span class="google-title">Review Us On Google</span>
          </div>

          <div class="stars">★★★★★</div>
          <h1 class="headline">${headline}</h1>
          <div class="business-name">${businessName}</div>

          <div class="qr-frame">
            <img src="${qrDataUrl}" alt="QR Code" class="qr-img" />
          </div>

          <div class="instructions">
            <div class="step"><span>1</span> Open Camera</div>
            <div class="step"><span>2</span> Point at QR</div>
            <div class="step"><span>3</span> Share 5-Stars</div>
          </div>

          <p class="subtext">${subtext}</p>
          <div class="footer-badge">Takes only 15 seconds • Verified Customer Reviews</div>
        </div>
      `;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Google Review Standee - ${businessName}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #1e293b;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .standee-card {
            width: 420px;
            padding: 40px 32px;
            background: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 24px;
            text-align: center;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .google-header {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 18px;
            border-radius: 9999px;
            margin-bottom: 16px;
          }
          .google-logo {
            width: 22px;
            height: 22px;
          }
          .google-title {
            font-size: 14px;
            font-weight: 700;
            color: #334155;
            letter-spacing: -0.2px;
          }
          .stars {
            font-size: 32px;
            color: #f59e0b;
            letter-spacing: 4px;
            line-height: 1;
            margin-bottom: 12px;
          }
          .stars.gold {
            color: #fbbf24;
          }
          .headline {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
          }
          .business-name {
            font-size: 18px;
            font-weight: 700;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
          }
          .qr-frame {
            padding: 16px;
            background: #ffffff;
            border: 2px solid #0f172a;
            border-radius: 20px;
            margin-bottom: 24px;
            display: inline-block;
          }
          .qr-img {
            width: 220px;
            height: 220px;
            display: block;
          }
          .instructions {
            display: flex;
            justify-content: center;
            gap: 14px;
            margin-bottom: 18px;
            width: 100%;
          }
          .step {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            background: #f1f5f9;
            padding: 6px 10px;
            border-radius: 8px;
          }
          .step span {
            width: 18px;
            height: 18px;
            background: #2563eb;
            color: #ffffff;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 800;
          }
          .subtext {
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
            max-width: 320px;
            margin-bottom: 16px;
          }
          .footer-badge {
            font-size: 10px;
            font-weight: 700;
            color: #059669;
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            padding: 5px 12px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .standee-card.dark-mode {
            background: #0f172a;
            color: #ffffff;
            border: 2px solid #334155;
          }
          .dark-mode .google-header {
            background: #1e293b;
            border-color: #334155;
          }
          .dark-mode .google-title {
            color: #f8fafc;
          }
          .dark-mode .headline {
            color: #ffffff;
          }
          .dark-mode .gold-text {
            color: #fbbf24;
          }
          .dark-mode .light-frame {
            background: #ffffff;
            border-color: #fbbf24;
          }
          .dark-mode .step {
            background: #1e293b;
            color: #cbd5e1;
          }
          .dark-mode .step span {
            background: #f59e0b;
            color: #0f172a;
          }
          .dark-mode .subtext {
            color: #94a3b8;
          }
          .dark-mode .footer-badge {
            background: #1e293b;
            color: #fbbf24;
            border-color: #fbbf24;
          }

          .table-tent-container {
            width: 100%;
            max-width: 520px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .panel {
            width: 100%;
            padding: 24px 20px;
            border: 2px dashed #cbd5e1;
            border-radius: 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #ffffff;
          }
          .fold-line {
            width: 100%;
            text-align: center;
            padding: 16px 0;
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 2px;
          }

          @media print {
            body {
              padding: 0;
              min-height: auto;
            }
            .standee-card {
              box-shadow: none;
              border: 2px solid #94a3b8;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${cardContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(printHtml);
    printWin.document.close();
    setIsPrinting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span>Print Review Standee & QR Poster</span>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  Ultra-HD Print Ready
                </span>
              </h3>
              <p className="text-xs text-text-muted">
                Display this counter standee or table tent at your billing desk so customers can scan & rate your business.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Left Column: Settings */}
          <div className="p-5 md:col-span-5 space-y-5 bg-surface">
            {/* Target Destination */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                <span>QR Scan Destination</span>
                <span className="text-[10px] font-normal text-text-muted">Where customers land</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('smart')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    targetType === 'smart'
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 shadow-2xs'
                      : 'bg-surface hover:bg-surface-subtle border-border text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Smart Shield</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 leading-tight">
                    Filters 1-3★ privately; 4-5★ sent to Google.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('direct')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    targetType === 'direct'
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-100 shadow-2xs'
                      : 'bg-surface hover:bg-surface-subtle border-border text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Direct Google</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 leading-tight">
                    Opens Google Maps native review dialog.
                  </p>
                </button>
              </div>

              {targetType === 'direct' && !directUrl && (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-[11px] text-amber-800 dark:text-amber-200">
                  ⚠️ Direct Google review link is not configured for this tenant yet. Falling back to Smart Review portal.
                </div>
              )}

              <div className="flex items-center gap-1 bg-surface-subtle p-2 rounded border border-border">
                <input
                  type="text"
                  readOnly
                  value={effectiveTargetUrl}
                  className="bg-transparent text-[11px] font-mono text-text-muted w-full focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary rounded border border-border text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Standee Template Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-text-muted" />
                <span>Standee Card Style</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplate('google_classic')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    template === 'google_classic'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                      : 'border-border bg-surface hover:bg-surface-subtle text-text-secondary text-xs font-medium'
                  }`}
                >
                  <div className="text-xs">Google Classic</div>
                  <span className="text-[9px] text-text-muted">Clean White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('modern_dark')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    template === 'modern_dark'
                      ? 'border-slate-800 bg-slate-900 text-white font-bold'
                      : 'border-border bg-surface hover:bg-surface-subtle text-text-secondary text-xs font-medium'
                  }`}
                >
                  <div className="text-xs">Obsidian Gold</div>
                  <span className="text-[9px] text-text-muted">Luxury Slate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('table_tent')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    template === 'table_tent'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                      : 'border-border bg-surface hover:bg-surface-subtle text-text-secondary text-xs font-medium'
                  }`}
                >
                  <div className="text-xs">Table Tent</div>
                  <span className="text-[9px] text-text-muted">Foldable A4</span>
                </button>
              </div>
            </div>

            {/* Text Customization */}
            <div className="space-y-3 pt-1 border-t border-border">
              <label className="text-xs font-bold text-text-primary">Text on Standee</label>
              
              <div>
                <span className="text-[10px] font-semibold text-text-secondary block mb-1">Business Name</span>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. SMAATO MOBILE"
                  className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <span className="text-[10px] font-semibold text-text-secondary block mb-1">Main Heading</span>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Review Us On Google"
                  className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <span className="text-[10px] font-semibold text-text-secondary block mb-1">Footer Message</span>
                <textarea
                  rows={2}
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  placeholder="Scan with your camera..."
                  className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded text-xs text-text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Standee Preview */}
          <div className="p-6 md:col-span-7 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center overflow-y-auto">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1">
              <span>Print Preview</span>
              <span>&bull;</span>
              <span>100% Scalable Vector / 300 DPI</span>
            </span>

            {/* Standee Card Frame */}
            <div
              className={`w-full max-w-sm rounded-2xl p-6 text-center shadow-xl border transition-all duration-200 ${
                template === 'modern_dark'
                  ? 'bg-slate-900 text-white border-slate-700 shadow-slate-950/50'
                  : 'bg-white text-slate-900 border-slate-200 shadow-slate-200/50'
              }`}
            >
              {/* Google Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold mb-3 border ${
                  template === 'modern_dark'
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.57H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.43l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.15c.95-2.83 3.6-4.97 6.72-4.97z"/>
                </svg>
                <span>Google Reviews</span>
              </div>

              {/* Stars */}
              <div className="text-amber-400 text-2xl tracking-widest leading-none mb-2">
                ★★★★★
              </div>

              {/* Heading */}
              <h4 className="text-xl font-extrabold tracking-tight mb-1">
                {headline || 'Review Us On Google'}
              </h4>

              {/* Business Name */}
              <div className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-amber-400 mb-4">
                {businessName || 'Your Business Name'}
              </div>

              {/* QR Image Box */}
              <div className="inline-block p-2 bg-white rounded-xl border-2 border-slate-900 shadow-inner mb-4">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-text-muted animate-pulse">
                    Generating HD QR...
                  </div>
                )}
              </div>

              {/* 3 Step Guide */}
              <div className="grid grid-cols-3 gap-1.5 mb-3 text-[10px] font-semibold">
                <div className={`p-1.5 rounded-md ${template === 'modern_dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  1. Open Camera
                </div>
                <div className={`p-1.5 rounded-md ${template === 'modern_dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  2. Scan QR
                </div>
                <div className={`p-1.5 rounded-md ${template === 'modern_dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  3. Share Rating
                </div>
              </div>

              <p className={`text-[11px] leading-relaxed max-w-xs mx-auto ${template === 'modern_dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {subtext}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-subtle">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Printer className="w-4 h-4 text-accent" />
            <span>Fits A4, Letter, 4x6, and standard acrylic tabletop standees.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-3 py-2 bg-surface hover:bg-surface-subtle border border-border text-text-primary rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Download 1024x1024 PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="px-3 py-2 bg-surface hover:bg-surface-subtle border border-border text-text-primary rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Download Infinite Scalable Vector SVG"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download SVG</span>
            </button>

            <button
              type="button"
              onClick={handlePrintStandee}
              disabled={isPrinting || !qrDataUrl}
              className="flex-1 sm:flex-initial px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Opening Print...' : 'Print Standee'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
