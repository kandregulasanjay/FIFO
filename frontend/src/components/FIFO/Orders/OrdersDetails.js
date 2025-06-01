import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderDetails, completeOrder, getPickslipPDF } from "../../../api/api"; 
import { generatePickslipPDF } from "./pickslipPDF";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrderDetails = () => {
    const { pickslipNumber } = useParams();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDownloadButton, setShowDownloadButton] = useState(false);
    const [noStock, setNoStock] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const submittingRef = useRef(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await fetchOrderDetails(pickslipNumber);
                if (data.length === 0) {
                    setNoStock(true);
                    toast.error("No stock available for this pickslip.");
                    console.log("Order details are empty:", data); 
                    return;
                }
                setOrderDetails(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [pickslipNumber]);

    const handleSubmit = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        if (submittingRef.current) return;
        submittingRef.current = true; 
        setShowConfirmModal(false);
        setSubmitDisabled(true);
        try {
            const totalAllocated = orderDetails.reduce((sum, item) => sum + item.receipt_allocated_qty, 0);
            const requiredQty = orderDetails[0].pickslip_qty;
            if (totalAllocated < requiredQty) {
                toast.error(`Only ${totalAllocated} available. Pending: ${requiredQty - totalAllocated}`);
                setSubmitDisabled(false);
                return;
            }
            const response = await completeOrder(pickslipNumber);

            if (response.showToast) {
                toast.error(response.message || "Some items are not available for allocation.");
                setSubmitDisabled(false);
                return;
            }

            if (response.success) {
                toast.success("Pickslip completed successfully.");
                setShowDownloadButton(true);
                setOrderDetails([]); // Clear data
            } else {
                toast.warn(response.message || "An unexpected error occurred.");
                setSubmitDisabled(false);
            }
        } catch (error) {
            toast.error(error.message || "An error occurred while completing the order.");
            setSubmitDisabled(false);
        } finally {
            submittingRef.current = false;
        }
    };

    const handleDownloadPickslip = async () => {
        try {
            const data = await getPickslipPDF(pickslipNumber);
            console.log("Pickslip PDF data:", data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (!Array.isArray(data.items)) {
                throw new Error("Invalid data format: items is not an array.");
            }

            generatePickslipPDF(
                pickslipNumber,
                data.items,
                data.customer_name,
                data.issued_at,
                data.invoice_number
            );
        } catch (error) {
            toast.error("Error downloading PDF: " + error.message);
        }
    };

    if (loading) return <p className="text-center text-gray-500 animate-pulse">Loading...</p>;

    return (
        <div className="p-4 w-full mx-auto  bg-white shadow-xl rounded-2xl backdrop-blur-lg">
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-lg font-bold mb-4">Confirm Submission</h2>
                        <p className="mb-6">Are you sure you want to submit this pickslip?</p>
                        <div className="flex justify-end gap-4">
                            <button
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                onClick={handleConfirmSubmit}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {noStock ? (
                <p className="text-center text-red-600 text-lg font-semibold">No stock available for this pickslip.</p>
            ) : (
                <>
                    <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">{pickslipNumber}</h1>
                    {orderDetails.length > 0 && (
                        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
                            <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                    <tr>
                                        {Object.keys(orderDetails[0]).map((col, index) => (
                                            <th key={index} className="py-4 px-6 capitalize text-left font-semibold border-b border-gray-300">{col.replace(/_/g, " ")}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderDetails.map((order, rowIndex) => (
                                        <tr key={rowIndex} className="border-b hover:bg-gray-50 transition-all">
                                            {Object.keys(order).map((col, colIndex) => (
                                                <td key={colIndex} className="py-3 px-6 border-b border-gray-300">{order[col]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Mobile view */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {orderDetails.length > 0 && (
                            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                                <div className="flex justify-between text-sm text-gray-700">
                                    <strong className="capitalize">Pickslip Number:</strong>
                                    <span>{pickslipNumber}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-700">
                                    <strong className="capitalize">Customer Name:</strong>
                                    <span>{orderDetails[0].customer_name}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-700">
                                    <strong className="capitalize">Order Date:</strong>
                                    <span>{orderDetails[0].order_date}</span>
                                </div>
                            </div>
                        )}
                        {orderDetails.map((order, index) => (
                            <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                                {Object.keys(order).filter(key => key !== 'customer_name' && key !== 'order_date').map((key, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <strong className="capitalize">{key.replace(/_/g, " ")}:</strong>
                                        <span>{order[key]}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Buttons section */}
                    {!showDownloadButton ? (
                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-600 text-sm w-40 disabled:opacity-50"
                                disabled={submitDisabled}
                            >
                                Submit
                            </button>
                            <button
                                onClick={() => navigate("/pending-pickslip")}
                                className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 text-sm w-40"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                onClick={handleDownloadPickslip}
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-all w-40"
                            >
                                Download
                            </button>
                            <button
                                onClick={() => navigate("/pending-pickslip")}
                                className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 text-sm w-40"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </>
            )}
            <ToastContainer />
        </div>
    );
};

export default OrderDetails;