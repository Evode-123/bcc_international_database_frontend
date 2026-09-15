import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';

// BCC brand palette, reused from tailwind.config.js so the exports match
// the app's own look (deep blue header, light blue tint, dark navy text).
const BRAND = {
  rgb: [10, 94, 176],       // #0A5EB0
  darkRgb: [8, 46, 66],     // close to #0A2E6E for headings
  paleRgb: [232, 244, 251], // #E8F4FB
  grayRgb: [110, 118, 128],
  borderRgb: [214, 232, 247], // #D6E8F7
  hex: '0A5EB0',
  darkHex: '0A2E6E',
  paleHex: 'E8F4FB',
  borderHex: 'D6E8F7',
  grayHex: '6B7280',
};

// Shared column set for both export formats, so the PDF and the Excel
// file always show the exact same fields in the exact same order.
// `pdfWidth` is a hand-tuned point width that keeps every header on a
// single line at the font sizes used below; `xlsxWidth` is an Excel
// "characters" column width.
// Every column is center-aligned (both header and data) in both exports,
// per how the report is meant to read -- a tidy, evenly balanced table
// rather than a left-ragged one.
const COLUMNS = [
  { key: 'no',       header: 'No',         pdfWidth: 28,  xlsxWidth: 6,  align: 'center' },
  { key: 'fullName', header: 'Full Name', pdfWidth: 190, xlsxWidth: 36, align: 'center' },
  { key: 'gender',   header: 'Gender',    pdfWidth: 58,  xlsxWidth: 11, align: 'center' },
  { key: 'center',   header: 'Center',    pdfWidth: 88,  xlsxWidth: 18, align: 'center' },
  { key: 'site',     header: 'Site',      pdfWidth: 82,  xlsxWidth: 17, align: 'center' },
  { key: 'gradYear', header: 'Grad Year', pdfWidth: 64,  xlsxWidth: 12, align: 'center' },
  { key: 'mode',     header: 'Mode',      pdfWidth: 70,  xlsxWidth: 13, align: 'center' },
  { key: 'phone',    header: 'Phone',     pdfWidth: 108, xlsxWidth: 20, align: 'center' },
  { key: 'city',     header: 'City',      pdfWidth: 70,  xlsxWidth: 15, align: 'center' },
];
// Total pdfWidth above is ~758pt, which comfortably fits inside an A4
// landscape page (~842pt wide, minus 2×36pt margins = ~770pt usable).
// The earlier version totaled 830pt, which overflowed the printable
// area and broke the table layout -- that's what you saw in the export.

// Picks the most recent training row off a disciple record -- same rule
// used on the directory page, so graduation year/mode shown here always
// matches what's shown there.
function latestTraining(disciple) {
  if (!disciple.trainings?.length) return null;
  return [...disciple.trainings].sort((a, b) => b.graduationYear - a.graduationYear)[0];
}

// Normalizes a raw disciple record (as returned by GET /disciples) into
// the flat row shape both exporters below consume.
function buildRows(disciples) {
  return disciples.map((disciple, index) => {
    const training = latestTraining(disciple);
    return {
      no: index + 1,
      fullName: [disciple.familyName, disciple.otherNames].filter(Boolean).join(' '),
      gender: disciple.gender || '—',
      center: disciple.trainingSite?.center?.name || '—',
      site: disciple.trainingSite?.name || '—',
      gradYear: training?.graduationYear ?? '—',
      mode: training?.trainingMode || '—',
      phone: disciple.phoneNumber || '—',
      city: disciple.city || '—',
    };
  });
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

// ── PDF export ──────────────────────────────────────────────────────────────
// filterSummary: short human-readable line describing what's currently
// filtered, e.g. `Center: ERC · Search: "grace"` or `Site: Masoro`.
// generatedBy: "Full Name (role)" shown in the report letterhead.
export function exportDisciplesToPdf({ disciples, filterSummary, generatedBy }) {
  const rows = buildRows(disciples);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 36;
  const generatedOn = new Date().toLocaleString();

  // ── Letterhead band ──
  // Title + subtitle are centered as one block, then the filter summary
  // and generated-by line each centered on their own line below -- to
  // match the centered banner used in the Excel export.
  const bandHeight = 82;
  doc.setFillColor(...BRAND.rgb);
  doc.rect(0, 0, pageWidth, bandHeight, 'F');
  // A thin accent line under the band for a bit of depth
  doc.setFillColor(...BRAND.darkRgb);
  doc.rect(0, bandHeight - 3, pageWidth, 3, 'F');

  const pageCenterX = pageWidth / 2;

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('BCC International Database', pageCenterX, bandHeight / 2 - 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.text('Disciples Report', pageCenterX, bandHeight / 2 + 15, { align: 'center' });

  // ── Meta strip: filter summary + generated-by/total, centered lines ──
  const metaY = bandHeight;
  const metaHeight = 38;
  doc.setFillColor(...BRAND.paleRgb);
  doc.rect(0, metaY, pageWidth, metaHeight, 'F');
  doc.setDrawColor(...BRAND.borderRgb);
  doc.setLineWidth(0.6);
  doc.line(0, metaY + metaHeight, pageWidth, metaY + metaHeight);

  doc.setTextColor(...BRAND.darkRgb);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(filterSummary || 'All disciples', pageCenterX, metaY + 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.grayRgb);
  const totalLabel = `${rows.length} disciple${rows.length === 1 ? '' : 's'}`;
  doc.text(
    `Generated by ${generatedBy}  ·  ${generatedOn}  ·  Total: ${totalLabel}`,
    pageCenterX,
    metaY + 29,
    { align: 'center' }
  );

  // ── Table ──
  // Centered on the page: the columns have a fixed total width, so with
  // `tableWidth: 'wrap'` the table only takes the space it needs, and
  // giving it equal left/right margins puts that block in the middle of
  // the page instead of hugging the left edge.
  const tableWidth = COLUMNS.reduce((sum, c) => sum + c.pdfWidth, 0);
  const sideMargin = Math.max(marginX, (pageWidth - tableWidth) / 2);

  autoTable(doc, {
    startY: metaY + metaHeight + 18,
    head: [COLUMNS.map((c) => c.header)],
    body: rows.map((row) => COLUMNS.map((c) => row[c.key])),
    theme: 'grid',
    tableWidth: 'wrap',
    styles: {
      font: 'helvetica',
      fontSize: 8.75,
      cellPadding: { top: 7, bottom: 7, left: 7, right: 7 },
      lineColor: BRAND.borderRgb,
      lineWidth: 0.6,
      textColor: [55, 65, 81],
      valign: 'middle',
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: BRAND.rgb,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9.25,
      halign: 'center',
      // White dividers between header cells -- previously this matched
      // BRAND.rgb, which made the borders invisible against the fill.
      lineColor: [255, 255, 255],
      lineWidth: 0.75,
      cellPadding: { top: 8, bottom: 8, left: 7, right: 7 },
    },
    alternateRowStyles: { fillColor: [246, 250, 254] },
    columnStyles: Object.fromEntries(
      COLUMNS.map((c, i) => [i, { cellWidth: c.pdfWidth, halign: c.align }])
    ),
    margin: { left: sideMargin, right: sideMargin, top: 40, bottom: 46 },
    // Runs on every page (including the first) -- keeps a slim branded
    // footer with page numbers on multi-page reports.
    didDrawPage: () => {
      const pageCount = doc.internal.getNumberOfPages();
      const pageH = doc.internal.pageSize.getHeight();
      doc.setDrawColor(...BRAND.borderRgb);
      doc.setLineWidth(0.6);
      doc.line(marginX, pageH - 30, pageWidth - marginX, pageH - 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.grayRgb);
      doc.text('BCC International Database — Disciples Report', pageWidth / 2, pageH - 16, { align: 'center' });
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        pageWidth - marginX,
        pageH - 16,
        { align: 'right' }
      );
    },
  });

  doc.save(`bcc-disciples-report-${dateStamp()}.pdf`);
}

// ── Excel export ─────────────────────────────────────────────────────────────
const THIN_BORDER = { style: 'thin', color: { rgb: BRAND.borderHex } };
const CELL_BORDER = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };

function titleCellStyle() {
  return {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
    fill: { fgColor: { rgb: BRAND.hex } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
}
function subtitleCellStyle() {
  return {
    font: { italic: true, sz: 10.5, color: { rgb: BRAND.darkHex }, name: 'Calibri' },
    fill: { fgColor: { rgb: BRAND.paleHex } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
}
function metaCellStyle() {
  return {
    font: { sz: 9.5, color: { rgb: BRAND.grayHex }, name: 'Calibri' },
    fill: { fgColor: { rgb: BRAND.paleHex } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { bottom: { style: 'thin', color: { rgb: BRAND.borderHex } } },
  };
}
function headerCellStyle(align) {
  return {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
    fill: { fgColor: { rgb: BRAND.hex } },
    alignment: { horizontal: align, vertical: 'center', wrapText: true },
    border: CELL_BORDER,
  };
}
function bodyCellStyle(align, isAltRow) {
  return {
    font: { sz: 10.5, color: { rgb: '374151' }, name: 'Calibri' },
    fill: { fgColor: { rgb: isAltRow ? 'F6FAFE' : 'FFFFFF' } },
    alignment: { horizontal: align, vertical: 'center' },
    border: CELL_BORDER,
  };
}

// filterSummary / generatedBy: same shape as exportDisciplesToPdf above.
export function exportDisciplesToExcel({ disciples, filterSummary, generatedBy }) {
  const rows = buildRows(disciples);
  const generatedOn = new Date().toLocaleString();
  const colCount = COLUMNS.length;

  const TITLE_ROW = 0;
  const SUBTITLE_ROW = 1;
  const META_ROW = 2;
  const HEADER_ROW = 3; // immediately follows the meta row -- no blank spacer
  const FIRST_DATA_ROW = HEADER_ROW + 1;

  const aoa = [];
  aoa[TITLE_ROW] = ['BCC International Database — Disciples Report'];
  aoa[SUBTITLE_ROW] = [filterSummary || 'All disciples'];
  aoa[META_ROW] = [
    `Generated by ${generatedBy} on ${generatedOn}  ·  Total: ${rows.length} disciple${rows.length === 1 ? '' : 's'}`,
  ];
  aoa[HEADER_ROW] = COLUMNS.map((c) => c.header);
  rows.forEach((row, i) => {
    aoa[FIRST_DATA_ROW + i] = COLUMNS.map((c) => row[c.key]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = COLUMNS.map((c) => ({ wch: c.xlsxWidth }));
  worksheet['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 18 }, { hpt: 22 }];

  // Merge the letterhead rows across every column so they read as one
  // banner instead of being crammed into column A.
  worksheet['!merges'] = [TITLE_ROW, SUBTITLE_ROW, META_ROW].map((r) => ({
    s: { r, c: 0 },
    e: { r, c: colCount - 1 },
  }));

  // Style the letterhead rows
  worksheet[XLSX.utils.encode_cell({ r: TITLE_ROW, c: 0 })].s = titleCellStyle();
  worksheet[XLSX.utils.encode_cell({ r: SUBTITLE_ROW, c: 0 })].s = subtitleCellStyle();
  worksheet[XLSX.utils.encode_cell({ r: META_ROW, c: 0 })].s = metaCellStyle();

  // Style the header row
  COLUMNS.forEach((c, i) => {
    const ref = XLSX.utils.encode_cell({ r: HEADER_ROW, c: i });
    if (worksheet[ref]) worksheet[ref].s = headerCellStyle(c.align);
  });

  // Style every data cell, alternating row shading for readability
  rows.forEach((_, rowIndex) => {
    const isAlt = rowIndex % 2 === 1;
    COLUMNS.forEach((c, colIndex) => {
      const ref = XLSX.utils.encode_cell({ r: FIRST_DATA_ROW + rowIndex, c: colIndex });
      if (worksheet[ref]) worksheet[ref].s = bodyCellStyle(c.align, isAlt);
    });
  });

  // Keep the header row frozen so it stays visible while scrolling a
  // long report -- no filter dropdowns on the header cells, by request.
  worksheet['!freeze'] = {
    xSplit: 0,
    ySplit: HEADER_ROW + 1,
    topLeftCell: `A${HEADER_ROW + 2}`,
    activePane: 'bottomLeft',
    state: 'frozen',
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Disciples Report');
  XLSX.writeFile(workbook, `bcc-disciples-report-${dateStamp()}.xlsx`);
}