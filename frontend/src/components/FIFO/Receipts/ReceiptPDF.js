import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from 'date-fns'; 

export const generateReceiptPDF = (receiptNumber, receiptDetails) => {
    const doc = new jsPDF();
    let yPos = 18;

    const addHeader = () => {
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Albabtain Auto", 15, yPos);
        doc.setFontSize(14);
        doc.text("Receipt Details", 140, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.text(`Receipt Number: ${receiptNumber}`, 15, yPos);
        doc.text(`Printed Date: ${new Date().toLocaleDateString()}`, 140, yPos);
        yPos += 8;

        const supplierName = receiptDetails.supplier_name || "N/A";
        const allocationDate = receiptDetails.allocation_date
            ? format(new Date(receiptDetails.allocation_date), 'dd/MM/yyyy') 
            : "N/A";

        doc.text(`Supplier Name: ${supplierName}`, 15, yPos)
        doc.text(`Allocation Date: ${allocationDate}`, 140, yPos);
        yPos += 8;

        doc.setLineWidth(0.5);
        doc.line(10, yPos, 200, yPos);
        yPos += 6;
    };

    const addPageBorder = () => {
        doc.setLineWidth(0.5);
        doc.rect(10, 10, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 20); 
    };

    addPageBorder(); // Add border to the first page
    addHeader();

    const tableData = receiptDetails.items.map((item, index) => [
        index + 1,
        item.make,
        item.item_code,
        item.item_description,
        item.bin_location,
        item.allocated_quantity,
        item.batch_number,
    ]);


    if (tableData.length === 0) {
        doc.text("No data available for this receipt.", 15, yPos);
    } else {
        doc.autoTable({
            startY: yPos + 5,
            head: [['S.No', 'Make', 'Item Code', 'Description', 'Bin Location', 'Quantity', 'Batch Number']],
            body: tableData,
            theme: 'grid', 
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { textColor: 0, fillColor: false,lineWidth: 0.1,    }, 
            margin: { left: 15, right: 15, top:15 },
            didDrawPage: (data) => {
                addPageBorder();
            },
        });
    }

    doc.save(`Receipt_${receiptNumber}.pdf`);
};
