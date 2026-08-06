import { Invoice, OfflineOrder, ShopDetails } from '../types';
import { formatINR, formatDate } from './utils';

/**
 * Triggers a clean print dialog for a POS Receipt / Tax Invoice via an isolated hidden iframe.
 * Prevents blank pages, background UI clutter, and web page printing errors.
 */
export const printPOSReceiptPDF = (order: OfflineOrder, shopDetails: ShopDetails) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const itemsList = order.items || [];
  const itemsRows = itemsList
    .map(
      (item, idx) => {
        const lineAmount = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : (item.qty || 1) * (item.unitPrice || 0);
        const pName = item.productName || 'Firecracker Item';
        const pSku = item.sku || 'N/A';
        const gst = item.gstPercent || 18;
        return `
    <tr>
      <td style="padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="font-weight: 600; color: #0f172a; font-size: 11px;">${pName}</div>
        <div style="font-size: 9px; color: #64748b;">SKU: ${pSku} &bull; GST ${gst}%</div>
      </td>
      <td style="text-align: center; font-weight: bold; font-size: 11px; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">${item.qty}</td>
      <td style="text-align: right; font-family: monospace; font-size: 11px; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">${formatINR(item.unitPrice)}</td>
      <td style="text-align: right; font-family: monospace; font-weight: bold; color: #0f172a; font-size: 11px; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">${formatINR(lineAmount)}</td>
    </tr>
  `;
      }
    )
    .join('');

  const calcTotalSum = itemsList.reduce(
    (sum, i) => sum + (typeof i.amount === 'number' && !isNaN(i.amount) ? i.amount : (i.qty || 1) * (i.unitPrice || 0)),
    0
  );
  const calcBaseSum = itemsList.reduce((sum, i) => {
    const amt = typeof i.amount === 'number' && !isNaN(i.amount) ? i.amount : (i.qty || 1) * (i.unitPrice || 0);
    const g = i.gstPercent || 18;
    return sum + amt / (1 + g / 100);
  }, 0);
  const calcGstSum = calcTotalSum - calcBaseSum;

  const displaySubtotal = order.subtotal || Number(calcBaseSum.toFixed(2));
  const displayGst = order.gstAmount || Number(calcGstSum.toFixed(2));
  const displayGrandTotal = order.grandTotal || Math.max(0, Math.round(calcTotalSum - (order.discountAmount || 0)));

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>POS_Bill_${order.billNumber}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
          }
          .receipt-box {
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 16px;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            margin: 0;
            color: #0f172a;
          }
          .tagline {
            font-size: 10px;
            color: #b91c1c;
            font-weight: 600;
            margin: 2px 0;
          }
          .info {
            font-size: 10px;
            color: #64748b;
          }
          .meta-table {
            width: 100%;
            font-size: 10px;
            margin-bottom: 10px;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 8px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-between: 10px;
          }
          .items-table th {
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
          }
          .totals {
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            margin-top: 10px;
            font-size: 11px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            color: #475569;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            font-weight: 900;
            font-size: 14px;
            color: #0f172a;
            border-top: 1px solid #0f172a;
            padding-top: 6px;
            margin-top: 4px;
          }
          .payment-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            border-radius: 6px;
            margin-top: 8px;
            font-size: 10px;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            color: #64748b;
            margin-top: 16px;
            border-top: 1px solid #f1f5f9;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h2 class="title">${shopDetails.name}</h2>
            <div class="tagline">${shopDetails.tagline}</div>
            <div class="info">${shopDetails.address}, ${shopDetails.cityState}</div>
            <div class="info">Phone: ${shopDetails.phone} | GSTIN: ${shopDetails.gstin}</div>
          </div>

          <table class="meta-table">
            <tr>
              <td><strong>Bill No:</strong> ${order.billNumber}</td>
              <td style="text-align: right;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>Customer:</strong> ${order.customerName || 'Walk-in Customer'}</td>
              <td style="text-align: right;"><strong>Payment:</strong> ${order.paymentMode}</td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal (Excl. GST):</span>
              <span>${formatINR(displaySubtotal)}</span>
            </div>
            <div class="totals-row">
              <span>GST Total:</span>
              <span>${formatINR(displayGst)}</span>
            </div>
            ${order.discountAmount ? `<div class="totals-row" style="color: #15803d;"><span>Discount:</span><span>-${formatINR(order.discountAmount)}</span></div>` : ''}
            <div class="grand-total">
              <span>Grand Total:</span>
              <span>${formatINR(displayGrandTotal)}</span>
            </div>

            <div class="payment-box">
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>Payment Mode:</span>
                <span style="text-transform: uppercase; color: #b45309;">${order.paymentMode}</span>
              </div>
              ${order.paymentMode === 'Cash' ? `<div style="display: flex; justify-content: space-between; margin-top: 2px;"><span>Cash Tendered:</span><span>${formatINR(order.cashAmount || displayGrandTotal)}</span></div>` : ''}
              ${order.paymentMode === 'UPI' ? `<div style="display: flex; justify-content: space-between; margin-top: 2px;"><span>UPI Paid:</span><span>${formatINR(order.upiAmount || displayGrandTotal)}</span></div>${order.upiRefNo ? `<div style="color: #64748b; font-family: monospace;">Ref: ${order.upiRefNo}</div>` : ''}` : ''}
              ${order.paymentMode === 'Split' ? `<div style="display: flex; justify-content: space-between; margin-top: 2px;"><span>Cash:</span><span>${formatINR(order.cashAmount || 0)}</span></div><div style="display: flex; justify-content: space-between;"><span>UPI:</span><span>${formatINR(order.upiAmount || 0)}</span></div>` : ''}
            </div>
          </div>

          <div class="footer">
            <p style="font-weight: bold; margin: 0 0 2px 0;">Thank you for purchasing 100% Green Certified Crackers!</p>
            <p style="margin: 0;">Wish you a Safe, Joyous & Sparkling Celebration.</p>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-family: monospace;">Computer Generated POS Tax Invoice</p>
          </div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      window.print();
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 300);
};

/**
 * Triggers a clean print dialog for a GST Tax Invoice via an isolated hidden iframe.
 * Prevents blank pages, background UI clutter, and browser styling glitches.
 */
export const printInvoicePDF = (invoice: Invoice) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const itemsRows = invoice.items
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; font-size: 11px;">${idx + 1}</td>
      <td style="font-family: monospace; font-weight: bold; color: #b91c1c; font-size: 11px;">${item.sku}</td>
      <td style="font-weight: 600; color: #0f172a; font-size: 11px;">${item.productName}</td>
      <td style="text-align: center; font-weight: bold; font-family: monospace; font-size: 11px;">${item.qty}</td>
      <td style="text-align: right; font-family: monospace; font-size: 11px;">${formatINR(item.sellingPrice)}</td>
      <td style="text-align: right; font-family: monospace; font-size: 11px;">${item.gstPercent}%</td>
      <td style="text-align: right; font-family: monospace; color: #475569; font-size: 11px;">${formatINR(item.gstAmount)}</td>
      <td style="text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c; font-size: 11px;">${formatINR(item.amount)}</td>
    </tr>
  `
    )
    .join('');

  const bankSection = invoice.shopDetails.bankName
    ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 10px; margin-bottom: 8px;">
      <p style="font-weight: bold; color: #1e293b; margin: 0 0 2px 0; font-family: sans-serif; text-transform: uppercase;">Bank Payment Details:</p>
      <p style="margin: 2px 0;">Bank: <b>${invoice.shopDetails.bankName}</b> | A/C Name: <b>${invoice.shopDetails.accountName}</b></p>
      <p style="margin: 2px 0;">A/C No: <b>${invoice.shopDetails.accountNumber}</b> | IFSC: <b>${invoice.shopDetails.ifscCode}</b></p>
      ${invoice.shopDetails.upiId ? `<p style="margin: 2px 0;">UPI ID: <b>${invoice.shopDetails.upiId}</b></p>` : ''}
    </div>
  `
    : '';

  const termsText = (invoice.shopDetails.terms || '1. Goods once sold will not be taken back or exchanged.\n2. Transport & freight charges extra at actuals during dispatch.\n3. Subject to Sivakasi Jurisdiction.').replace(/\n/g, '<br/>');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice_${invoice.id}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .invoice-box {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .shop-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .shop-tagline {
            font-size: 11px;
            color: #b91c1c;
            font-weight: 600;
            margin: 2px 0 6px 0;
          }
          .shop-info {
            font-size: 11px;
            color: #475569;
            line-height: 1.4;
          }
          .inv-badge-card {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 10px 14px;
            border-radius: 6px;
            text-align: right;
            min-width: 200px;
          }
          .inv-badge-title {
            font-size: 10px;
            font-weight: 800;
            color: #b91c1c;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .inv-id {
            font-size: 16px;
            font-weight: 800;
            font-family: monospace;
            color: #0f172a;
            margin: 2px 0;
          }
          .customer-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            border-radius: 6px;
            margin-bottom: 16px;
          }
          .customer-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .grid-2 {
            display: table;
            width: 100%;
          }
          .col-half {
            display: table-cell;
            width: 50%;
            vertical-align: top;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .items-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            padding: 8px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          .items-table td {
            padding: 7px 8px;
            border: 1px solid #e2e8f0;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 12px;
            width: 240px;
            float: right;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            font-family: monospace;
            font-size: 12px;
            margin-bottom: 4px;
            color: #475569;
          }
          .totals-grand {
            display: flex;
            justify-content: space-between;
            font-family: monospace;
            font-size: 14px;
            font-weight: 800;
            color: #b91c1c;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            margin-top: 4px;
          }
          .footer-sign {
            margin-top: 40px;
            display: table;
            width: 100%;
          }
          .sign-cell {
            display: table-cell;
            width: 50%;
            vertical-align: bottom;
            font-size: 11px;
            color: #475569;
          }
          .sign-right {
            text-align: right;
          }
          .sign-line {
            border-top: 1px solid #94a3b8;
            padding-top: 4px;
            margin-top: 35px;
            display: inline-block;
            min-width: 160px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <!-- Header -->
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <h1 class="shop-title">${invoice.shopDetails.name}</h1>
                <div class="shop-tagline">${invoice.shopDetails.tagline}</div>
                <div class="shop-info">
                  ${invoice.shopDetails.address}<br/>
                  Phone: ${invoice.shopDetails.phone} | WhatsApp: ${invoice.shopDetails.whatsapp}<br/>
                  Email: ${invoice.shopDetails.email}<br/>
                  <span style="font-family: monospace; font-weight: bold; color: #b91c1c;">GSTIN: ${invoice.shopDetails.gstin}</span>
                </div>
              </td>
              <td style="vertical-align: top; text-align: right; width: 220px;">
                <div class="inv-badge-card">
                  <div class="inv-badge-title">GST TAX INVOICE</div>
                  <div class="inv-id">${invoice.id}</div>
                  <div style="font-size: 11px; color: #475569; margin-top: 2px;">Date: <b>${formatDate(invoice.date)}</b></div>
                  <div style="font-size: 11px; color: #475569; font-family: monospace;">Ref Enquiry: <b>${invoice.enquiryNo}</b></div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Billed To Customer Card -->
          <div class="customer-card">
            <div class="customer-label">Billed To (Customer Details)</div>
            <div class="grid-2">
              <div class="col-half">
                <strong style="font-size: 13px; color: #0f172a;">${invoice.customerDetails.name}</strong><br/>
                <span style="color: #475569;">Mobile: ${invoice.customerDetails.mobile}</span>
              </div>
              <div class="col-half">
                <span style="color: #475569;"><b>Dispatch Address:</b> ${invoice.customerDetails.address}</span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 80px;">SKU</th>
                <th>Item Description</th>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 80px; text-align: right;">Rate (₹)</th>
                <th style="width: 60px; text-align: right;">GST %</th>
                <th style="width: 80px; text-align: right;">GST Amt (₹)</th>
                <th style="width: 90px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Summary & Terms -->
          <table class="summary-table">
            <tr>
              <td style="vertical-align: top; padding-right: 16px;">
                ${bankSection}
                <div style="font-size: 11px; color: #475569;">
                  <strong style="color: #0f172a;">Terms & Conditions:</strong><br/>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${termsText}</div>
                </div>
              </td>
              <td style="vertical-align: top; width: 240px;">
                <div class="totals-box">
                  <div class="totals-row">
                    <span>Subtotal (Base):</span>
                    <span>${formatINR(invoice.subtotal)}</span>
                  </div>
                  <div class="totals-row">
                    <span>Total GST (18%):</span>
                    <span>${formatINR(invoice.gstAmount)}</span>
                  </div>
                  <div class="totals-grand">
                    <span>Grand Total:</span>
                    <span>${formatINR(invoice.grandTotal)}</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Signatures -->
          <div class="footer-sign">
            <div class="sign-cell">
              <p style="margin: 0;">Customer Seal & Signature</p>
            </div>
            <div class="sign-cell sign-right">
              <strong style="color: #0f172a;">For ${invoice.shopDetails.name}</strong><br/>
              <div class="sign-line">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Give iframe images and styles a brief moment to render before calling print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 300);
};

/**
 * Triggers a clean print dialog for Reports (Sales / Enquiries / Inventory) via hidden iframe
 */
export const printReportPDF = (title: string, reportTableHtml: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
          }
          h2 {
            font-size: 16px;
            margin: 0 0 4px 0;
            color: #0f172a;
          }
          p { margin: 0 0 12px 0; color: #64748b; font-size: 10px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background-color: #f1f5f9;
            color: #1e293b;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            padding: 8px 6px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          td {
            padding: 6px;
            border: 1px solid #e2e8f0;
          }
          .font-mono { font-family: monospace; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .text-red { color: #b91c1c; }
        </style>
      </head>
      <body>
        <h2>Sri Laxmi Fireworks Wholesale - B2B ${title.toUpperCase()}</h2>
        <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
        <div>
          ${reportTableHtml}
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 300);
};
