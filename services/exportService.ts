import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data: any[], columns: any[], fileName: string) => {
    const exportData = data.map(row => {
        const newRow: Record<string, any> = {};
        columns.forEach(col => {
            const value = col.accessor(row);
            // Handle React nodes by extracting text content if possible
            if (typeof value === 'object' && value !== null && value.props && value.props.children) {
                 newRow[col.header] = value.props.children;
            } else {
                 newRow[col.header] = value;
            }
        });
        return newRow;
    });
    
    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Rapor');
    writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPdf = (data: any[], columns: any[], title: string, fileName: string) => {
    const doc = new jsPDF();
    
    // Add a modern font - jsPDF supports standard fonts by default
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 20);

    const body = data.map(row => columns.map(col => {
        const value = col.accessor(row);
         if (typeof value === 'object' && value !== null && value.props && value.props.children) {
            return String(value.props.children);
        }
        return String(value);
    }));

    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: body,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }, // slate-800
        styles: { font: 'helvetica' }
    });

    doc.save(`${fileName}.pdf`);
};