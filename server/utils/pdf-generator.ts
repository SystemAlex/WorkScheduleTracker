import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import {
  EmployeeHoursReport,
  getMonthName,
  ShiftBreakdownItem,
} from '@shared/utils';
import type { Cliente, Position } from '@shared/schema';

// Define colors from tailwind.config.ts for server-side use
const NEUTRAL_COLORS = {
  '50': '#FAFAFA',
  '100': '#F5F5F5',
  '200': '#E5E5E5',
  '300': '#D4D4D4',
  '400': '#A3A3A3',
  '500': '#737373',
  '600': '#525252',
  '700': '#404040',
  '800': '#262626',
  '900': '#1F1F1F',
};

export class PdfGenerator {
  async generatePdfReport(
    report: EmployeeHoursReport[],
    groupedPositionsByClient: Array<[number, Position[]]>,
    clientes: Cliente[],
    selectedMonth: number,
    selectedYear: number,
    totalReportHours: number,
    totalReportShifts: number,
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      layout: 'landscape',
    });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const monthName = getMonthName(selectedMonth - 1);

    // Register a font if available, otherwise use default
    // For 'Inter', you would need to load the font file:
    // doc.registerFont('Inter-Bold', 'path/to/Inter-Bold.ttf');
    // doc.registerFont('Inter-Regular', 'path/to/Inter-Regular.ttf');

    doc
      .fontSize(16)
      .font('Helvetica-Bold') // Fallback to Helvetica-Bold
      .text(`Reporte de Turnos - ${monthName} ${selectedYear}`, {
        align: 'center',
      });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica'); // Fallback to Helvetica
    doc.text(`Total Horas: ${totalReportHours}`);
    doc.text(`Total Turnos: ${totalReportShifts}`);
    doc.moveDown();

    // Table headers
    const mainHeaders = ['Empleado', 'Total Horas', 'Total Turnos'];
    const positionSiglasHeaders = groupedPositionsByClient.flatMap(
      ([, clientPositions]) => clientPositions.map((pos) => pos.siglas),
    );

    // Calculate column widths dynamically based on content or a more balanced approach
    const tableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidths: number[] = [];

    // Fixed width for first three columns
    colWidths.push(tableWidth * 0.15); // Employee Name
    colWidths.push(tableWidth * 0.08); // Total Hours
    colWidths.push(tableWidth * 0.08); // Total Shifts

    // Distribute remaining width among position columns
    const remainingWidth =
      tableWidth - colWidths[0] - colWidths[1] - colWidths[2];
    const positionColCount = positionSiglasHeaders.length;
    const positionColWidth =
      positionColCount > 0 ? remainingWidth / positionColCount : 0;
    for (let i = 0; i < positionColCount; i++) {
      colWidths.push(positionColWidth);
    }

    const rowHeight = 20;
    let currentY = doc.y;
    const startX = doc.page.margins.left;

    // Draw client group headers (first row of headers)
    let currentX = startX;
    doc.font('Helvetica-Bold').fontSize(10);
    groupedPositionsByClient.forEach(([clientId, clientPositions]) => {
      const clientName =
        clientes.find((c) => c.id === clientId)?.empresa || 'Sin Cliente';
      const clientGroupWidth = clientPositions.length * positionColWidth;

      // Draw background for client header
      doc
        .rect(currentX, currentY, clientGroupWidth, rowHeight)
        .fill(NEUTRAL_COLORS['100']) // bg-neutral-100
        .stroke(NEUTRAL_COLORS['200']); // border-neutral-200

      doc
        .fillColor(NEUTRAL_COLORS['700']) // text-neutral-700
        .text(clientName, currentX, currentY + 5, {
          width: clientGroupWidth,
          align: 'center',
        });
      currentX += clientGroupWidth;
    });

    // Draw main headers (Empleado, Total Horas, Total Turnos)
    currentX = startX;
    doc
      .rect(currentX, currentY, colWidths[0], rowHeight)
      .fill(NEUTRAL_COLORS['100'])
      .stroke(NEUTRAL_COLORS['200']);
    doc
      .fillColor(NEUTRAL_COLORS['700'])
      .text(mainHeaders[0], currentX, currentY + 5, {
        width: colWidths[0],
        align: 'center',
      });
    currentX += colWidths[0];

    doc
      .rect(currentX, currentY, colWidths[1], rowHeight)
      .fill(NEUTRAL_COLORS['100'])
      .stroke(NEUTRAL_COLORS['200']);
    doc
      .fillColor(NEUTRAL_COLORS['700'])
      .text(mainHeaders[1], currentX, currentY + 5, {
        width: colWidths[1],
        align: 'center',
      });
    currentX += colWidths[1];

    doc
      .rect(currentX, currentY, colWidths[2], rowHeight)
      .fill(NEUTRAL_COLORS['100'])
      .stroke(NEUTRAL_COLORS['200']);
    doc
      .fillColor(NEUTRAL_COLORS['700'])
      .text(mainHeaders[2], currentX, currentY + 5, {
        width: colWidths[2],
        align: 'center',
      });
    currentX += colWidths[2];

    currentY += rowHeight;

    // Draw position siglas headers (second row of headers)
    currentX = startX;
    doc.font('Helvetica-Bold').fontSize(9);
    mainHeaders.forEach((header, i) => {
      doc
        .rect(currentX, currentY, colWidths[i], rowHeight)
        .fill(NEUTRAL_COLORS['100'])
        .stroke(NEUTRAL_COLORS['200']);
      doc
        .fillColor(NEUTRAL_COLORS['700'])
        .text(header, currentX, currentY + 5, {
          width: colWidths[i],
          align: 'center',
        });
      currentX += colWidths[i];
    });

    positionSiglasHeaders.forEach((sigla, i) => {
      const pos = groupedPositionsByClient.flatMap(
        ([, clientPositions]) => clientPositions,
      )[i];
      doc
        .rect(currentX, currentY, positionColWidth, rowHeight)
        .fill(pos.color + '20') // Background color
        .stroke(NEUTRAL_COLORS['200']); // Border color
      doc
        .fillColor(pos.color) // Text color
        .text(sigla, currentX, currentY + 5, {
          width: positionColWidth,
          align: 'center',
        });
      currentX += positionColWidth;
    });
    currentY += rowHeight;

    // Draw data rows
    doc.font('Helvetica').fontSize(8);
    report.forEach((employee) => {
      currentX = startX;
      const rowCells = [
        employee.employeeName,
        employee.totalHours.toString(),
        employee.totalShifts.toString(),
      ];
      groupedPositionsByClient.forEach(([, clientPositions]) => {
        clientPositions.forEach((pos) => {
          const match = employee.shiftBreakdown.find(
            (s: ShiftBreakdownItem) => s.positionId === pos.id,
          );
          rowCells.push(
            match && match.totalHoras > 0 ? match.totalHoras.toString() : '',
          );
        });
      });

      rowCells.forEach((cellText, i) => {
        const colW = colWidths[i] || positionColWidth;
        const isEmployeeName = i === 0;
        const isTotalHoursOrShifts = i === 1 || i === 2;
        const isPositionCell = i >= 3;

        // Draw cell background and border
        doc
          .rect(currentX, currentY, colW, rowHeight)
          .fill(
            isEmployeeName
              ? NEUTRAL_COLORS['300'] + '20'
              : NEUTRAL_COLORS['50'],
          ) // bg-neutral-300/20 for employee name, bg-neutral-50 for others
          .stroke(NEUTRAL_COLORS['200']); // border-neutral-200

        // Apply specific fill for position cells with values
        if (isPositionCell && cellText !== '') {
          const pos = groupedPositionsByClient.flatMap(
            ([, clientPositions]) => clientPositions,
          )[i - 3];
          if (pos) {
            doc
              .rect(currentX, currentY, colW, rowHeight)
              .fill(pos.color + '20') // Background color with transparency
              .stroke(pos.color); // Border color
          }
        }

        // Apply text color and font
        doc.fillColor(NEUTRAL_COLORS['900']); // Default text-neutral-900
        if (isEmployeeName) {
          doc.font('Helvetica-Bold').fontSize(9);
        } else if (isTotalHoursOrShifts) {
          doc.font('Helvetica-Bold').fontSize(9);
        } else if (isPositionCell && cellText !== '') {
          const pos = groupedPositionsByClient.flatMap(
            ([, clientPositions]) => clientPositions,
          )[i - 3];
          if (pos) {
            doc.fillColor(pos.color); // Position specific color
            doc.font('Helvetica-Bold').fontSize(8);
          }
        } else {
          doc.font('Helvetica').fontSize(8);
        }

        doc.text(cellText, currentX, currentY + 5, {
          width: colW,
          align: 'center',
        });
        currentX += colW;
      });
      currentY += rowHeight;
    });

    // Draw total row
    currentX = startX;
    const totalRowCells = [
      'Total',
      totalReportHours.toString(),
      totalReportShifts.toString(),
    ];
    groupedPositionsByClient.forEach(([, clientPositions]) => {
      clientPositions.forEach((pos) => {
        const totalPos = report.reduce(
          (sum: number, e: EmployeeHoursReport) => {
            const match = e.shiftBreakdown.find(
              (s: ShiftBreakdownItem) => s.positionId === pos.id,
            );
            return sum + (match ? match.totalHoras : 0);
          },
          0,
        );
        totalRowCells.push(totalPos > 0 ? totalPos.toString() : '');
      });
    });

    totalRowCells.forEach((cellText, i) => {
      const colW = colWidths[i] || positionColWidth;
      const isTotalLabel = i === 0;
      const isPositionTotalCell = i >= 3;

      doc
        .rect(currentX, currentY, colW, rowHeight)
        .fill(NEUTRAL_COLORS['100']) // bg-neutral-100
        .stroke(NEUTRAL_COLORS['200']); // border-neutral-200

      // Apply specific fill for position total cells with values
      if (isPositionTotalCell && cellText !== '') {
        const pos = groupedPositionsByClient.flatMap(
          ([, clientPositions]) => clientPositions,
        )[i - 3];
        if (pos) {
          doc
            .rect(currentX, currentY, colW, rowHeight)
            .fill(pos.color + '20') // Background color with transparency
            .stroke(pos.color); // Border color
        }
      }

      doc.fillColor(NEUTRAL_COLORS['800']); // text-neutral-800
      doc.font('Helvetica-Bold').fontSize(10);

      doc.text(cellText, currentX, currentY + 5, {
        width: colW,
        align: isTotalLabel ? 'right' : 'center',
      });
      currentX += colW;
    });
    currentY += rowHeight;

    doc.end?.();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers) as Buffer);
      });
    });
  }
}
