import React, { useEffect, useState } from "react";
import { fetchReserveData, fetchReserveReleaseData } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RefreshIcon, FilterIcon, XIcon } from "@heroicons/react/outline";

const ReservePage = () => {
    const [reserveData, setReserveData] = useState([]);
    const [reserveReleaseData, setReserveReleaseData] = useState([]);
    const [reserveCurrentPage, setReserveCurrentPage] = useState(1);
    const [releaseCurrentPage, setReleaseCurrentPage] = useState(1);
    const [reserveFilter, setReserveFilter] = useState("");
    const [releaseFilter, setReleaseFilter] = useState("");
    const [showReserveFilterPopup, setShowReserveFilterPopup] = useState(false);
    const [showReleaseFilterPopup, setShowReleaseFilterPopup] = useState(false);
    const rowsPerPage = 15;

    // Pagination logic for Reserve Table
    const reserveIndexOfLastRow = reserveCurrentPage * rowsPerPage;
    const reserveIndexOfFirstRow = reserveIndexOfLastRow - rowsPerPage;
    const filteredReserveData = reserveData.filter(record =>
        reserveFilter ? record.receipt_number.toLowerCase().includes(reserveFilter.toLowerCase()) : true
    );
    const reserveCurrentRows = filteredReserveData.slice(reserveIndexOfFirstRow, reserveIndexOfLastRow);
    const reserveTotalPages = Math.ceil(filteredReserveData.length / rowsPerPage);

    // Pagination logic for Reserve Release Table
    const releaseIndexOfLastRow = releaseCurrentPage * rowsPerPage;
    const releaseIndexOfFirstRow = releaseIndexOfLastRow - rowsPerPage;
    const filteredReleaseData = reserveReleaseData.filter(record =>
        releaseFilter ? record.receipt_number.toLowerCase().includes(releaseFilter.toLowerCase()) : true
    );
    const releaseCurrentRows = filteredReleaseData.slice(releaseIndexOfFirstRow, releaseIndexOfLastRow);
    const releaseTotalPages = Math.ceil(filteredReleaseData.length / rowsPerPage);

    useEffect(() => {
        const loadReserveData = async () => {
            try {
                const data = await fetchReserveData();
                setReserveData(data);
            } catch (error) {
                toast.error("Error loading reserve data");
            }
        };

        const loadReserveReleaseData = async () => {
            try {
                const data = await fetchReserveReleaseData();
                setReserveReleaseData(data);
            } catch (error) {
                toast.error("Error loading reserve release data");
            }
        };

        loadReserveData();
        loadReserveReleaseData();
    }, []);

    const handleRefresh = () => {
        setReserveFilter("");
        setReleaseFilter("");
        setReserveCurrentPage(1);
        setReleaseCurrentPage(1);
    };

    const handleReserveReset = () => {
        setReserveFilter("");
        setReserveCurrentPage(1);
    };

    const handleReleaseReset = () => {
        setReleaseFilter("");
        setReleaseCurrentPage(1);
    };

    return (
        <div className="p-4 pt-0">
            <div className="flex justify-between items-center mb-4 mt-2">
                <h2 className="text-xl font-semibold hidden sm:block">Reserve</h2>
                {/* Desktop/Tablet Filters */}
                <div className="hidden sm:flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="Filter Reserve Table"
                        value={reserveFilter}
                        onChange={(e) => setReserveFilter(e.target.value)}
                        className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Filter Reserve Release Table"
                        value={releaseFilter}
                        onChange={(e) => setReleaseFilter(e.target.value)}
                        className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                    />
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                    >
                        <RefreshIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Mobile: Search + Filter Button Row for Reserve */}
            <div className="sm:hidden flex items-center gap-2 mb-2">
                <input
                    type="text"
                    placeholder="Filter Reserve Table"
                    value={reserveFilter}
                    onChange={(e) => setReserveFilter(e.target.value)}
                    className="flex-1 p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                />
                <button
                    onClick={() => setShowReserveFilterPopup(true)}
                    className="p-2 rounded-md shadow-md bg-white border-2"
                    style={{
                        borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                        borderRadius: "8px"
                    }}
                >
                    <FilterIcon className="h-6 w-6 text-blue-600" />
                </button>
            </div>

            {/* Reserve Table - Desktop */}
            <div className="hidden md:block mb-8">
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    {reserveCurrentRows.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">No data found</div>
                    ) : (
                        <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <tr>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Receipt Number</th>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Receipt Status</th>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Receipt Type</th>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Receipt Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reserveCurrentRows.map((record, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.receipt_number}</td>
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.receipt_status}</td>
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.receipt_type}</td>
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.receipt_comment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {filteredReserveData.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setReserveCurrentPage(reserveCurrentPage - 1)}
                            disabled={reserveCurrentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 mx-1">{reserveCurrentPage} of {reserveTotalPages}</span>
                        <button
                            onClick={() => setReserveCurrentPage(reserveCurrentPage + 1)}
                            disabled={reserveCurrentPage === reserveTotalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Reserve Table - Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4 mb-8">
                {reserveCurrentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                        No data found
                    </div>
                ) : (
                    reserveCurrentRows.map((record, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Number:</strong>
                                <span>{record.receipt_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Status:</strong>
                                <span>{record.receipt_status}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Type:</strong>
                                <span>{record.receipt_type}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Comment:</strong>
                                <span>{record.receipt_comment}</span>
                            </div>
                        </div>
                    ))
                )}
                {filteredReserveData.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setReserveCurrentPage(reserveCurrentPage - 1)}
                            disabled={reserveCurrentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 mx-1">{reserveCurrentPage} of {reserveTotalPages}</span>
                        <button
                            onClick={() => setReserveCurrentPage(reserveCurrentPage + 1)}
                            disabled={reserveCurrentPage === reserveTotalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile: Search + Filter Button Row for Reserve Release */}
            <div className="sm:hidden flex items-center gap-2 mb-2">
                <input
                    type="text"
                    placeholder="Filter Reserve Release Table"
                    value={releaseFilter}
                    onChange={(e) => setReleaseFilter(e.target.value)}
                    className="flex-1 p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                />
                <button
                    onClick={() => setShowReleaseFilterPopup(true)}
                    className="p-2 rounded-md shadow-md bg-white border-2"
                    style={{
                        borderImage: "linear-gradient(90deg, #fbbf24, #f59e42) 1",
                        borderRadius: "8px"
                    }}
                >
                    <FilterIcon className="h-6 w-6 text-yellow-600" />
                </button>
            </div>

            {/* Reserve Release Table - Desktop */}
            <div className="hidden md:block">
                <h3 className="text-lg font-semibold mb-4">Reserve Release Data</h3>
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    {releaseCurrentRows.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">No data found</div>
                    ) : (
                        <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                            <thead className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
                                <tr>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Receipt Number</th>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Receipt Status</th>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Receipt Type</th>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Receipt Comment</th>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Created Date</th>
                                    <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Transfer Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {releaseCurrentRows.map((record, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.receipt_number}</td>
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.receipt_status}</td>
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.receipt_type}</td>
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.receipt_comment}</td>
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.created_at}</td>
                                        <td className="py-3 px-6 border-b border-gray-300 text-center">{record.transfer_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {filteredReleaseData.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setReleaseCurrentPage(releaseCurrentPage - 1)}
                            disabled={releaseCurrentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 mx-1">{releaseCurrentPage} of {releaseTotalPages}</span>
                        <button
                            onClick={() => setReleaseCurrentPage(releaseCurrentPage + 1)}
                            disabled={releaseCurrentPage === releaseTotalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Reserve Release Table - Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                <h3 className="text-lg font-semibold mb-4">Reserve Release Data</h3>
                {releaseCurrentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-200 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-lg">
                        No data found
                    </div>
                ) : (
                    releaseCurrentRows.map((record, index) => (
                        <div key={index} className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-lg shadow-lg text-black">
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Number:</strong>
                                <span>{record.receipt_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Status:</strong>
                                <span>{record.receipt_status}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Type:</strong>
                                <span>{record.receipt_type}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Comment:</strong>
                                <span>{record.receipt_comment}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Created Date:</strong>
                                <span>{record.created_at}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Transfer Date:</strong>
                                <span>{record.transfer_date}</span>
                            </div>
                        </div>
                    ))
                )}
                {filteredReleaseData.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setReleaseCurrentPage(releaseCurrentPage - 1)}
                            disabled={releaseCurrentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 mx-1">{releaseCurrentPage} of {releaseTotalPages}</span>
                        <button
                            onClick={() => setReleaseCurrentPage(releaseCurrentPage + 1)}
                            disabled={releaseCurrentPage === releaseTotalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Reserve Filter Popup for Mobile */}
            {showReserveFilterPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-xs shadow-lg border-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                            borderRadius: "16px"
                        }}
                    >
                        <button
                            onClick={() => setShowReserveFilterPopup(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-center">Reserve Filters</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Filter Reserve Table"
                                value={reserveFilter}
                                onChange={(e) => setReserveFilter(e.target.value)}
                                className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReserveReset}
                                    className="flex-1 px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => { setShowReserveFilterPopup(false); }}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reserve Release Filter Popup for Mobile */}
            {showReleaseFilterPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-xs shadow-lg border-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #fbbf24, #f59e42) 1",
                            borderRadius: "16px"
                        }}
                    >
                        <button
                            onClick={() => setShowReleaseFilterPopup(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-center">Release Filters</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Filter Reserve Release Table"
                                value={releaseFilter}
                                onChange={(e) => setReleaseFilter(e.target.value)}
                                className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReleaseReset}
                                    className="flex-1 px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => { setShowReleaseFilterPopup(false); }}
                                    className="flex-1 px-3 py-1 bg-yellow-500 text-sm text-white rounded-md hover:bg-yellow-600 transition"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
        </div>
    );
};

export default ReservePage;
