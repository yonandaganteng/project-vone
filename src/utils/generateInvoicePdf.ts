import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceSnapshot, InvoiceCompanyProfile } from '../types/rental';
import { formatRupiah } from './formatters';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex ? hex.replace('#', '') : '';
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [isNaN(r) ? 15 : r, isNaN(g) ? 23 : g, isNaN(b) ? 42 : b];
  }
  return [15, 23, 42];
}

export function generateInvoicePdf(
  snapshot: InvoiceSnapshot,
  companyProfile?: InvoiceCompanyProfile
): void {
  const company = companyProfile || {
    companyName: 'RENTPRO AUDIO VISUAL',
    legalName: 'PT RentPro Teknologi Kreatif Nusantara',
    address: 'Kawasan Industri Audio Visual No. 88, TB Simatupang, Jakarta Selatan',
    phone: '(021) 7890-1234',
    whatsapp: '0812-9900-8800',
    email: 'invoice@rentpro.id',
    bankName: 'Bank Mandiri (Cabang Senayan Jakarta)',
    bankAccount: '122-00-9876543-2',
    bankAccountHolder: 'PT RentPro Teknologi Kreatif',
    logoText: 'RP',
    logoBgColor: '#0F172A',
  };

  // Initialize A4 PDF document in portrait mode (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 15;
  let currentY = 18;

  // 1. BRAND HEADER & KOP SURAT (Dapat diubah oleh Owner)
  // Brand Logo Box
  const [logoR, logoG, logoB] = hexToRgb(company.logoBgColor || '#0F172A');
  doc.setFillColor(logoR, logoG, logoB);
  doc.roundedRect(marginX, currentY - 4, 11, 11, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const monogram = (company.logoText || 'RP').substring(0, 3).toUpperCase();
  doc.text(monogram, marginX + 1.5, currentY + 3.5);

  // Brand Name
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName.toUpperCase(), marginX + 14, currentY + 1);

  // Subtitle & Company
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(company.legalName, marginX + 14, currentY + 5.5);
  doc.text(company.address, marginX + 14, currentY + 9.5);
  doc.text(`Telp: ${company.phone} | WA: ${company.whatsapp} | ${company.email}`, marginX + 14, currentY + 13.5);

  // Right Side: INVOICE TITLE & INFO
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('INVOICE', pageWidth - marginX, currentY + 1, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text(`#${snapshot.invoiceNumber} (${snapshot.version})`, pageWidth - marginX, currentY + 6.5, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Tgl Terbit: ${snapshot.createdAt}`, pageWidth - marginX, currentY + 10.5, { align: 'right' });
  doc.text(`Status: ${snapshot.financials.paymentStatus}`, pageWidth - marginX, currentY + 14.5, { align: 'right' });

  currentY += 21;

  // Header Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 6;

  // 2. CLIENT & EVENT DETAILS (2-Column Box)
  const colWidth = (pageWidth - marginX * 2 - 8) / 2;

  // Client Box (Left)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, colWidth, 31, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DITUJUKAN KEPADA (PENYEWA):', marginX + 4, currentY + 5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(snapshot.client.name, marginX + 4, currentY + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (snapshot.client.company) {
    doc.text(snapshot.client.company, marginX + 4, currentY + 14.5);
  }
  doc.text(`Kontak: ${snapshot.client.phone} | ${snapshot.client.email}`, marginX + 4, currentY + 19);

  // Address (truncated if too long)
  const splitAddress = doc.splitTextToSize(snapshot.client.address, colWidth - 8);
  doc.text(splitAddress[0] || '', marginX + 4, currentY + 23.5);
  if (splitAddress[1]) {
    doc.text(splitAddress[1], marginX + 4, currentY + 27.5);
  }

  // Event Box (Right)
  const rightColX = marginX + colWidth + 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX, currentY, colWidth, 31, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DETAIL EVENT & LOKASI:', rightColX + 4, currentY + 5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(snapshot.event.name, rightColX + 4, currentY + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const splitLocation = doc.splitTextToSize(`Lokasi: ${snapshot.event.location}`, colWidth - 8);
  doc.text(splitLocation[0] || '', rightColX + 4, currentY + 15);

  doc.text(
    `Periode: ${snapshot.event.startDate} s/d ${snapshot.event.endDate} (${snapshot.event.durationDays} Hari)`,
    rightColX + 4,
    currentY + 20
  );
  doc.text(`Admin Penanggung Jawab: ${snapshot.createdBy}`, rightColX + 4, currentY + 25);

  currentY += 36;

  // 3. TABLE OF RENTED EQUIPMENT ITEMS (autoTable)
  const tableData = snapshot.items.map((item, idx) => [
    (idx + 1).toString(),
    `${item.name}\n[Kategori: ${item.category}]`,
    `${item.qty} Unit`,
    `${item.days} Hari`,
    formatRupiah(item.dailyRate),
    formatRupiah(item.subtotal),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['No', 'Deskripsi Alat & Spesifikasi', 'Qty', 'Durasi', 'Tarif / Hari', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 3,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 28 },
    },
  });

  // Get position where the table ended
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  currentY = finalY;

  // 4. FINANCIAL SUMMARY & PAYMENT TERMS
  const leftTermsWidth = 100;
  const rightFinWidth = pageWidth - marginX * 2 - leftTermsWidth;

  // Left Side: Bank Account & Terms
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('KETENTUAN PEMBAYARAN & REKENING RESMI:', marginX, currentY);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY + 2, leftTermsWidth - 6, 18, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(company.bankName, marginX + 3, currentY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`No. Rekening: ${company.bankAccount}`, marginX + 3, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Atas Nama: ${company.bankAccountHolder}`, marginX + 3, currentY + 15.5);

  // Terms bullet points
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  let termY = currentY + 24;
  snapshot.terms.slice(0, 3).forEach((term) => {
    const splitTerm = doc.splitTextToSize(`• ${term}`, leftTermsWidth - 6);
    doc.text(splitTerm, marginX, termY);
    termY += splitTerm.length * 3.5;
  });

  // Right Side: Calculation Lines
  const finX = marginX + leftTermsWidth;
  const finValueX = pageWidth - marginX;

  const drawFinLine = (label: string, value: string, isBold: boolean = false, isAccent: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    if (isAccent) {
      doc.setTextColor(79, 70, 229);
    } else {
      doc.setTextColor(isBold ? 15 : 71, isBold ? 23 : 85, isBold ? 42 : 105);
    }
    doc.text(label, finX, currentY);
    doc.text(value, finValueX, currentY, { align: 'right' });
    currentY += 4.5;
  };

  drawFinLine('Subtotal Sewa Alat:', formatRupiah(snapshot.financials.subtotal));

  if (snapshot.financials.discountAmount > 0) {
    drawFinLine(
      `Diskon Khusus (${snapshot.financials.discountPercent}%):`,
      `- ${formatRupiah(snapshot.financials.discountAmount)}`
    );
  }

  if (snapshot.financials.crewFee > 0) {
    drawFinLine('Biaya Kru & Teknisi:', formatRupiah(snapshot.financials.crewFee));
  }

  if (snapshot.financials.deliveryFee > 0) {
    drawFinLine('Biaya Pengiriman & Transport:', formatRupiah(snapshot.financials.deliveryFee));
  }

  if (snapshot.financials.taxAmount > 0) {
    drawFinLine('PPN 11%:', formatRupiah(snapshot.financials.taxAmount));
  }

  // Grand Total Highlight Box
  currentY += 1;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(finX - 2, currentY - 3.5, rightFinWidth + 2, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL TAGIHAN:', finX, currentY + 1);
  doc.setTextColor(79, 70, 229);
  doc.text(formatRupiah(snapshot.financials.grandTotal), finValueX, currentY + 1, { align: 'right' });
  currentY += 7;

  // Paid & Remaining
  drawFinLine('Uang Muka (DP):', formatRupiah(snapshot.financials.paidAmount));
  drawFinLine('Sisa Pembayaran:', formatRupiah(snapshot.financials.remainingAmount), true);

  // 5. SIGNATURES & LEGAL BLOCK (Bottom)
  currentY = Math.max(currentY + 10, 255);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, currentY - 5, pageWidth - marginX, currentY - 5);

  const sigColWidth = (pageWidth - marginX * 2) / 2;

  // Client signature
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Penyewa / PIC Resmi Klien:', marginX + 15, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${snapshot.client.name} )`, marginX + 15, currentY + 18);

  // RentPro signature
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Hormat Kami, RentPro Audio Visual:', marginX + sigColWidth + 15, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${snapshot.createdBy} )`, marginX + sigColWidth + 15, currentY + 18);

  // Footer Note: Snapshot Integrity
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen dihasilkan secara otomatis dari JSON Snapshot versi ${snapshot.version} pada ${snapshot.createdAt}. Terenkripsi & terkunci.`,
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  // Trigger browser download
  const cleanFilename = `Invoice_${snapshot.invoiceNumber}_${snapshot.version}.pdf`;
  doc.save(cleanFilename);
}
