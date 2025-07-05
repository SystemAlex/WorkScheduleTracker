import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import { getMonthName } from '@shared/utils';
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

interface ShiftBreakdownItem {
  positionId: number;
  name: string;
  siglas: string;
  color: string;
  totalHoras: number;
}

interface EmployeeHoursReport {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  totalShifts: number;
  shiftBreakdown: ShiftBreakdownItem[];
}

// Helper function to convert HEX color to ARGB with optional alpha
function hexToArgb(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = Math.round(alpha * 255);
  return (
    a.toString(16).padStart(2, '0') +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}

export class ExcelGenerator {
  async generateExcelReport(
    report: EmployeeHoursReport[],
    groupedPositionsByClient: Array<[number, Position[]]>,
    clientes: Cliente[],
    selectedMonth: number,
    selectedYear: number,
    totalReportHours: number,
    totalReportShifts: number,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Turnos');

    const monthName = getMonthName(selectedMonth - 1);

    worksheet.properties.defaultRowHeight = 20;

    // Title
    const titleRow = worksheet.addRow([
      `Reporte de Turnos - ${monthName} ${selectedYear}`,
    ]);
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, 3);
    titleRow.getCell(1).font = { bold: true, size: 16 };
    titleRow.getCell(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    worksheet.addRow([]); // Empty row for spacing

    // Summary
    const summaryRow1 = worksheet.addRow(['Total Horas:', totalReportHours]);
    summaryRow1.getCell(1).font = { size: 12 };
    summaryRow1.getCell(1).alignment = { horizontal: 'right' }; // Align title to right
    summaryRow1.getCell(2).font = { size: 12, bold: true }; // Make value bold
    summaryRow1.getCell(2).alignment = { horizontal: 'center' }; // Align value to center

    const summaryRow2 = worksheet.addRow(['Total Turnos:', totalReportShifts]);
    summaryRow2.getCell(1).font = { size: 12 };
    summaryRow2.getCell(1).alignment = { horizontal: 'right' }; // Align title to right
    summaryRow2.getCell(2).font = { size: 12, bold: true }; // Make value bold
    summaryRow2.getCell(2).alignment = { horizontal: 'center' }; // Align value to center

    worksheet.addRow([]); // Empty row for spacing

    // Headers
    const clientHeaderRowData = ['Empleado', 'Total Horas', 'Total Turnos'];
    const positionHeaderRowData = ['', '', ''];

    groupedPositionsByClient.forEach(([clientId, clientPositions]) => {
      const clientName =
        clientes.find((c) => c.id === clientId)?.empresa || 'Sin Cliente';
      clientHeaderRowData.push(clientName);
      for (let i = 1; i < clientPositions.length; i++) {
        clientHeaderRowData.push('');
      }
      clientPositions.forEach((pos) => {
        positionHeaderRowData.push(pos.siglas);
      });
    });

    const headerRow1 = worksheet.addRow(clientHeaderRowData);
    const headerRow2 = worksheet.addRow(positionHeaderRowData);

    // Set a fixed height for the client header row to allow for wrapping
    headerRow1.height = 30; // Adjusted height to 30

    // Apply styles to header rows
    [headerRow1, headerRow2].forEach((row) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: hexToArgb(NEUTRAL_COLORS['100']) }, // bg-neutral-100
        };
        cell.font = {
          bold: true, // font-medium
          color: { argb: hexToArgb(NEUTRAL_COLORS['700']) }, // text-neutral-700
          size: 11, // Set font size to 11
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: hexToArgb('#000000') } }, // Black solid border
          left: { style: 'thin', color: { argb: hexToArgb('#000000') } }, // Black solid border
          bottom: { style: 'thin', color: { argb: hexToArgb('#000000') } }, // Black solid border
          right: { style: 'thin', color: { argb: hexToArgb('#000000') } }, // Black solid border
        };
      });
    });

    // Merge "Empleado", "Total Horas", "Total Turnos" vertically
    worksheet.mergeCells(headerRow1.number, 1, headerRow2.number, 1);
    worksheet.mergeCells(headerRow1.number, 2, headerRow2.number, 2);
    worksheet.mergeCells(headerRow1.number, 3, headerRow2.number, 3);

    // Apply styles to the merged cells (they are part of headerRow1)
    headerRow1.getCell(1).value = 'Empleado';
    headerRow1.getCell(2).value = 'Total Horas';
    headerRow1.getCell(3).value = 'Total Turnos';

    headerRow1.getCell(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    headerRow1.getCell(2).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    headerRow1.getCell(3).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    // Merge client header cells and apply wrapText and middle alignment
    let currentColumn = 4;
    groupedPositionsByClient.forEach(([_clientId, clientPositions]) => {
      const startMergeCol = currentColumn;
      const endMergeCol = currentColumn + clientPositions.length - 1;
      if (clientPositions.length > 0) {
        // Only merge if there are positions for the client
        worksheet.mergeCells(
          headerRow1.number,
          startMergeCol,
          headerRow1.number,
          endMergeCol,
        );
        // Apply wrapText to the merged cell and set vertical alignment to middle
        headerRow1.getCell(startMergeCol).alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
      }
      currentColumn += clientPositions.length;
    });

    // Apply specific styles to position header row (row 2) - NO COLORS
    currentColumn = 4;
    groupedPositionsByClient.forEach(([_clientId, clientPositions]) => {
      clientPositions.forEach((pos) => {
        const cell = headerRow2.getCell(currentColumn);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: hexToArgb(NEUTRAL_COLORS['100']) }, // Neutral background
        };
        cell.font = {
          bold: true,
          color: { argb: hexToArgb(NEUTRAL_COLORS['700']) }, // Neutral text color
          size: 11, // Set font size to 11
        };
        currentColumn++;
      });
    });

    // Set freeze pane after headers (after title, 2 summary rows, 2 empty rows, and 2 header rows = 1+2+2+2 = 7 rows)
    // Data starts at row 8. Headers end at row 7. So freeze at ySplit: 7.
    worksheet.views = [
      { state: 'frozen', xSplit: 3, ySplit: headerRow2.number },
    ];

    // Data rows
    report.forEach((employee) => {
      const rowData = [
        employee.employeeName,
        employee.totalHours,
        employee.totalShifts,
      ];
      groupedPositionsByClient.forEach(([_clientId, clientPositions]) => {
        clientPositions.forEach((pos) => {
          const match = employee.shiftBreakdown.find(
            (s: { positionId: number }) => s.positionId === pos.id,
          );
          rowData.push(match && match.totalHoras > 0 ? match.totalHoras : '');
        });
      });
      const dataRow = worksheet.addRow(rowData);

      // Apply styles to data row cells
      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'dotted', color: { argb: hexToArgb('#000000') } }, // Black dotted border
          left: { style: 'thin', color: { argb: hexToArgb('#000000') } }, // Black solid border
          bottom: { style: 'dotted', color: { argb: hexToArgb('#000000') } }, // Black dotted border
          right: { style: 'thin', color: { argb: hexToArgb('#000000') } }, // Black solid border
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { size: 11 }; // Set font size to 11 for data

        if (colNumber === 1) {
          // Employee name column
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: hexToArgb(NEUTRAL_COLORS['300'], 0.2) }, // bg-neutral-300/20
          };
          cell.font = {
            bold: true,
            color: { argb: hexToArgb(NEUTRAL_COLORS['900']) }, // text-neutral-900
            size: 11, // Set font size to 11
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else if (colNumber === 2 || colNumber === 3) {
          // Total Hours, Total Shifts
          cell.font = { bold: true, size: 11 }; // Set font size to 11
        } else {
          // Position cells - NO COLORS
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: hexToArgb(NEUTRAL_COLORS['50']) }, // Light neutral background
          };
          cell.font = {
            bold: true, // Keep bold for values
            color: { argb: hexToArgb(NEUTRAL_COLORS['900']) }, // Dark neutral text
            size: 11, // Set font size to 11
          };
        }
      });
    });

    // Calculate the row numbers for the data range
    const firstDataRow = headerRow2.number + 1;
    const lastDataRow = headerRow2.number + report.length;

    // Total row data with formulas
    const totalRowData: (string | number | { formula: string })[] = ['Total'];

    // Total Horas (Column B)
    totalRowData.push({ formula: `SUM(B${firstDataRow}:B${lastDataRow})` });

    // Total Turnos (Column C)
    totalRowData.push({ formula: `SUM(C${firstDataRow}:C${lastDataRow})` });

    // Position totals (starting from Column D)
    let currentPositionColIndex = 4; // D is the 4th column
    groupedPositionsByClient.forEach(([_clientId, clientPositions]) => {
      clientPositions.forEach(() => {
        const colLetter = worksheet.getColumn(currentPositionColIndex).letter;
        totalRowData.push({
          formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
        });
        currentPositionColIndex++;
      });
    });

    // Add the total row to the worksheet
    const totalRow = worksheet.addRow(totalRowData);

    // Apply styles to total row cells
    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: hexToArgb(NEUTRAL_COLORS['100']) }, // bg-neutral-100
      };
      cell.font = {
        bold: true,
        color: { argb: hexToArgb(NEUTRAL_COLORS['800']) }, // text-neutral-800
        size: 11, // Set font size to 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: hexToArgb('#000000') } }, // Black solid border, medium thickness
        left: { style: 'medium', color: { argb: hexToArgb('#000000') } }, // Black solid border, medium thickness
        bottom: { style: 'medium', color: { argb: hexToArgb('#000000') } }, // Black solid border, medium thickness
        right: { style: 'medium', color: { argb: hexToArgb('#000000') } }, // Black solid border, medium thickness
      };

      if (colNumber === 1) {
        // Total label
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colNumber > 3) {
        // Position totals - NO COLORS
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: hexToArgb(NEUTRAL_COLORS['100']) },
        };
        cell.font = {
          bold: true,
          color: { argb: hexToArgb(NEUTRAL_COLORS['900']) }, // Set text color to dark neutral
          size: 11, // Set font size to 11
        };
      }
    });

    // Set specific column widths
    worksheet.getColumn(1).width = 25; // Employee Name
    worksheet.getColumn(2).width = 12; // Total Horas
    worksheet.getColumn(3).width = 12; // Total Turnos

    // Set width for position columns
    let colIdx = 4;
    groupedPositionsByClient.forEach(([_clientId, clientPositions]) => {
      clientPositions.forEach(() => {
        worksheet.getColumn(colIdx).width = 8; // Fixed width for siglas/hours
        colIdx++;
      });
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
