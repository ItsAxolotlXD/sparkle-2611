import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';

export interface SlideData {
  id: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  notes?: string;
  layout?: 'title' | 'content' | 'quote' | 'two-column';
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  bgColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  bgColor?: string;
  fontFamily?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
}

export interface CellInfo {
  value: string;
  style?: CellStyle;
}

// ==================== 1. WRITE EXPORTS (.docx, .pdf) ====================

export async function createDocxBlob(title: string, rawText: string): Promise<Blob> {
  const safeTitle = (title || 'Document').trim();
  const paragraphs: Paragraph[] = [];

  // Title paragraph
  paragraphs.push(
    new Paragraph({
      text: safeTitle,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    })
  );

  // If htmlText is available, strip simple blocks or split by lines
  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 150 } }));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.replace(/^#\s*/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 150 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.replace(/^##\s*/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 120 },
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(trimmed.replace(/^[-*]\s*/, ''))],
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(trimmed)],
          spacing: { after: 120 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function exportDocx(title: string, rawText: string, _htmlText?: string) {
  const safeTitle = (title || 'Document').trim();
  const blob = await createDocxBlob(title, rawText);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportWritePdf(title: string, content: string) {
  const safeTitle = (title || 'Document').trim();
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const margin = 45;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = 60;

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(safeTitle, margin, y);
  y += 35;

  // Horizontal line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, y - 10, pageWidth - margin, y - 10);

  // Content
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const lines = content.split('\n');
  for (const line of lines) {
    if (y > 780) {
      pdf.addPage();
      y = 60;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      y += 14;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(trimmed.replace(/^#\s*/, ''), margin, y);
      y += 24;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
    } else if (trimmed.startsWith('## ')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text(trimmed.replace(/^##\s*/, ''), margin, y);
      y += 20;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
    } else {
      const wrapped = pdf.splitTextToSize(trimmed, maxWidth);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 15 + 4;
    }
  }

  pdf.save(`${safeTitle}.pdf`);
}

// ==================== 2. PRESENT EXPORTS (.pptx, .pdf) ====================

export async function exportPptx(title: string, slides: SlideData[]) {
  const safeTitle = (title || 'Presentation').trim();
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = safeTitle;

  for (const slide of slides) {
    const s = pptx.addSlide();

    // Background color
    if (slide.bgColor) {
      s.background = { color: slide.bgColor.replace('#', '') };
    } else {
      s.background = { color: '1e1e24' };
    }

    const fontColor = slide.textColor ? slide.textColor.replace('#', '') : 'FFFFFF';
    const fontFamily = slide.fontFamily || 'Segoe UI';

    if (slide.layout === 'title') {
      s.addText(slide.title, {
        x: '10%',
        y: '30%',
        w: '80%',
        h: '25%',
        fontSize: slide.fontSize ? Math.round(slide.fontSize * 1.5) : 38,
        fontFace: fontFamily,
        color: fontColor,
        bold: slide.isBold !== false,
        italic: !!slide.isItalic,
        underline: slide.isUnderline ? { style: 'sng' } : undefined,
        align: 'center',
        valign: 'middle',
      });

      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: '15%',
          y: '55%',
          w: '70%',
          h: '15%',
          fontSize: 18,
          fontFace: fontFamily,
          color: '94A3B8',
          align: 'center',
        });
      }
    } else if (slide.layout === 'quote') {
      s.addText(`"${slide.title}"`, {
        x: '12%',
        y: '30%',
        w: '76%',
        h: '30%',
        fontSize: 28,
        fontFace: fontFamily,
        color: fontColor,
        italic: true,
        align: 'center',
        valign: 'middle',
      });
      if (slide.subtitle) {
        s.addText(`— ${slide.subtitle}`, {
          x: '20%',
          y: '62%',
          w: '60%',
          h: '10%',
          fontSize: 16,
          fontFace: fontFamily,
          color: '4CC2FF',
          align: 'center',
        });
      }
    } else {
      // Content layout
      s.addText(slide.title, {
        x: '8%',
        y: '8%',
        w: '84%',
        h: '15%',
        fontSize: slide.fontSize || 28,
        fontFace: fontFamily,
        color: fontColor,
        bold: slide.isBold !== false,
        italic: !!slide.isItalic,
        underline: slide.isUnderline ? { style: 'sng' } : undefined,
      });

      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: '8%',
          y: '22%',
          w: '84%',
          h: '8%',
          fontSize: 14,
          fontFace: fontFamily,
          color: '94A3B8',
        });
      }

      if (slide.bullets && slide.bullets.length > 0) {
        const bulletObjects = slide.bullets.map((b) => ({
          text: b,
          options: {
            fontSize: 16,
            fontFace: fontFamily,
            color: 'E2E8F0',
            bullet: true,
            breakLine: true,
          },
        }));

        s.addText(bulletObjects, {
          x: '8%',
          y: slide.subtitle ? '32%' : '26%',
          w: '84%',
          h: '60%',
          valign: 'top',
        });
      }
    }
  }

  await pptx.writeFile({ fileName: `${safeTitle}.pptx` });
}

export function exportPresentPdf(title: string, slides: SlideData[]) {
  const safeTitle = (title || 'Presentation').trim();
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [960, 540], // 16:9
  });

  slides.forEach((slide, idx) => {
    if (idx > 0) pdf.addPage([960, 540], 'landscape');

    // Slide Background
    pdf.setFillColor(30, 30, 36);
    pdf.rect(0, 0, 960, 540, 'F');

    // Slide border accent
    pdf.setDrawColor(76, 194, 255);
    pdf.setLineWidth(2);
    pdf.line(50, 480, 910, 480);

    // Slide header
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.text(slide.title, 60, 80);

    if (slide.subtitle) {
      pdf.setTextColor(160, 174, 192);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(16);
      pdf.text(slide.subtitle, 60, 115);
    }

    if (slide.bullets && slide.bullets.length > 0) {
      pdf.setTextColor(226, 232, 240);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(18);
      let bulletY = 160;
      slide.bullets.forEach((b) => {
        pdf.setFillColor(76, 194, 255);
        pdf.circle(70, bulletY - 5, 3.5, 'F');
        pdf.text(b, 85, bulletY);
        bulletY += 36;
      });
    }

    // Slide counter footer
    pdf.setTextColor(113, 128, 150);
    pdf.setFontSize(11);
    pdf.text(`Slide ${idx + 1} of ${slides.length} • Sparkle Present`, 60, 508);
  });

  pdf.save(`${safeTitle}.pdf`);
}

// ==================== 3. TABLE EXPORTS (.xlsx, .pdf) ====================

export function exportXlsx(
  title: string,
  rowCount: number,
  cols: string[],
  gridData: Record<string, string | CellInfo>,
  evaluatedData?: Record<string, string>
) {
  const safeTitle = (title || 'Workbook').trim();
  const wsData: (string | number)[][] = [];

  // Header row
  wsData.push(['', ...cols]);

  for (let r = 1; r <= rowCount; r++) {
    const rowVals: (string | number)[] = [r];
    for (const c of cols) {
      const cellKey = `${c}${r}`;
      const raw = gridData[cellKey];
      const val: string = typeof raw === 'object' && raw ? String(raw.value) : String(raw || '');
      const displayVal: string = evaluatedData?.[cellKey] ?? val;

      const num = Number(displayVal);
      if (!isNaN(num) && displayVal.trim() !== '' && !displayVal.startsWith('0') && displayVal.length < 12) {
        rowVals.push(num);
      } else {
        rowVals.push(displayVal);
      }
    }
    wsData.push(rowVals);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${safeTitle}.xlsx`);
}

export function exportTablePdf(
  title: string,
  rowCount: number,
  cols: string[],
  gridData: Record<string, string | CellInfo>,
  evaluatedData?: Record<string, string>
) {
  const safeTitle = (title || 'Workbook').trim();
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(safeTitle, 40, 45);

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated by Sparkle Table • ${new Date().toLocaleDateString()}`, 40, 62);

  // Simple grid rendering
  const startX = 40;
  let startY = 80;
  const colWidth = (pageWidth - startX * 2 - 35) / cols.length;
  const rowHeight = 22;

  // Header Background
  pdf.setFillColor(40, 40, 50);
  pdf.rect(startX, startY, pageWidth - startX * 2, rowHeight, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);

  // Row index header cell
  pdf.text('#', startX + 10, startY + 15);

  cols.forEach((col, i) => {
    pdf.text(col, startX + 35 + i * colWidth + 8, startY + 15);
  });

  startY += rowHeight;

  // Rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  for (let r = 1; r <= Math.min(rowCount, 25); r++) {
    // Zebra striping
    if (r % 2 === 0) {
      pdf.setFillColor(245, 247, 250);
      pdf.rect(startX, startY, pageWidth - startX * 2, rowHeight, 'F');
    }
    pdf.setDrawColor(220, 224, 230);
    pdf.line(startX, startY + rowHeight, pageWidth - startX, startY + rowHeight);

    pdf.setTextColor(120, 120, 120);
    pdf.text(String(r), startX + 10, startY + 15);

    pdf.setTextColor(30, 30, 30);
    cols.forEach((col, i) => {
      const cellKey = `${col}${r}`;
      const raw = gridData[cellKey];
      const val: string = typeof raw === 'object' && raw ? String(raw.value) : String(raw || '');
      const displayVal: string = evaluatedData?.[cellKey] ?? val;
      const textToDraw = displayVal.length > 18 ? displayVal.slice(0, 17) + '…' : displayVal;
      pdf.text(textToDraw, startX + 35 + i * colWidth + 8, startY + 15);
    });

    startY += rowHeight;
  }

  pdf.save(`${safeTitle}.pdf`);
}
