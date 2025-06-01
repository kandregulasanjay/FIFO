import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateHoldingPDF = (pickslipNumber, orderDetails, customerName, type, invoiceNumber) => {
    const doc = new jsPDF();
    let yPos = 18;

   const addHeader = () => {
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Albabtain Auto", 15, yPos);
        doc.setFontSize(14);
        doc.text(type === "current" ? "Holding Release Details" : "Holding Release Summary", 140, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.text(`Pickslip Number: ${pickslipNumber}`, 15, yPos);
        doc.text(`Invoice Number: ${invoiceNumber}`, 140, yPos);
        yPos += 8;

        doc.text(`Issued Date: ${new Date().toLocaleString()}`, 15, yPos);
        doc.text(`Printed Date: ${new Date().toLocaleDateString()}`, 140, yPos);
        
        yPos += 8;

        doc.text(`Customer Name: ${customerName}`, 15, yPos);
        yPos += 8;

        doc.setLineWidth(0.5);
        doc.line(10, yPos, 200, yPos);
        yPos += 6;
    };

    const addPageBorder = () => {
        doc.setLineWidth(0.5);
        doc.rect(10, 10, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 20);
    };

    addPageBorder();
    addHeader();
    const tableData = orderDetails.map((item, index) => [
        invoiceNumber,
        item.make,
        item.item_code,
        item.bin_location,
        item.ordered_qty,
        item.new_allocated_qty,
        item.remaining_qty,
        item.customerName
    ]);

    if (tableData.length === 0) {
        doc.text("No data available for this holding.", 15, yPos);
    } else {
        doc.autoTable({
            startY: yPos + 5,
            head: [['Make', 'Item Code', 'Bin Location', 'Ordered Qty', 'Issued Qty', 'Remaining Qty']],
            body: tableData, 
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { textColor: 0, fillColor: false, lineWidth: 0.1 },
            margin: { left: 15, right: 15, top: 15 },
            didDrawPage: (data) => {
                addPageBorder();
            },
        });
    }

    doc.save(`Holding_${pickslipNumber}.pdf`);
};

