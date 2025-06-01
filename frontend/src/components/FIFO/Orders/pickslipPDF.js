import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const generatePickslipPDF = (pickslipNumber, orderDetails, customerName, issuedAt, invoice_number) => {
    if (!Array.isArray(orderDetails)) {
        console.error("Invalid orderDetails: Expected an array.");
        toast.error("Error generating PDF: Invalid order details format.");
        return;
    }

    const doc = new jsPDF();
    let yPos = 18;

    const addHeader = () => {
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Albabtain Auto", 15, yPos);
        doc.setFontSize(14);
        doc.text("Bin Allocation", 140, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.text(`Pickslip Number: ${pickslipNumber}`, 15, yPos);
        doc.text(`Printed Date: ${new Date().toLocaleDateString()}`, 140, yPos);
        yPos += 8;

        const invoiceNumberForHeader = invoice_number || (orderDetails.length > 0 ? orderDetails[0].invoice_number : "N/A");
        doc.text(`Invoice Number: ${invoiceNumberForHeader}`, 15, yPos);
        doc.text(`Issued At: ${new Date(issuedAt).toLocaleDateString()}`, 140, yPos);
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

    const groupedOrders = orderDetails.reduce((acc, order) => {
        if (!acc[order.item_code]) {
            acc[order.item_code] = {
                item_code: order.item_code,
                make: order.make,
                allocations: []
            };
        }
        acc[order.item_code].allocations.push({
            bin_location: order.bin_location,
            batch_number: order.batch_number,
            issued_qty: order.issued_quantity
        });
        return acc;
    }, {});

    const tableData = [];
    let serialNo = 1;
    Object.values(groupedOrders).forEach(order => {
        order.allocations.forEach(alloc => {
            tableData.push([
                serialNo++,
                alloc.bin_location,
                order.make,
                order.item_code,
                alloc.batch_number,
                alloc.issued_qty
            ]);
        });
    });

    doc.autoTable({
        startY: yPos + 5,
        head: [['S.No', 'Bin Location', 'Make', 'Item Code', 'Batch Number', 'Issued Quantity']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: {
            textColor: 0,
            fillColor: false,
            lineWidth: 0.1,
        },
        margin: { left: 15, right: 15, top: 15 },
        didDrawPage: (data) => {
            addPageBorder();
        },
    });

    doc.save(`Pickslip_${pickslipNumber}.pdf`);
};