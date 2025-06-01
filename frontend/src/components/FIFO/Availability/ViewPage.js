import React, { useState, useEffect } from 'react';
import { fetchViewData } from '../../../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RefreshIcon, FilterIcon, XIcon, DownloadIcon } from "@heroicons/react/outline";
import Select from "react-select";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ViewPage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [itemCodeOptions, setItemCodeOptions] = useState([]);
  const [selectedItemCode, setSelectedItemCode] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const rowsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    fetchViewData()
      .then(response => {
        setData(response);
        setFilteredData(response);
        const options = [...new Set(response.map(item => item.item_code))].map(code => ({
          value: code,
          label: code
        }));
        setItemCodeOptions(options);
      })
      .catch(error => {
        toast.error('Error fetching data');
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleFilterChange = (selectedOption) => {
    setSelectedItemCode(selectedOption);
    if (!selectedOption) {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(item => item.item_code === selectedOption.value));
    }
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchViewData()
      .then(response => {
        setData(response);
        setFilteredData(response);
        const options = [...new Set(response.map(item => item.item_code))].map(code => ({
          value: code,
          label: code
        }));
        setItemCodeOptions(options);
        setSelectedItemCode(null);
      })
      .catch(error => {
        toast.error('Error fetching data');
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleReset = () => {
    setSelectedItemCode(null);
    setFilteredData(data);
    setCurrentPage(1);
  };

  // Export to Excel
  const handleDownloadExcel = () => {
    const exportData = filteredData.length > 0 ? filteredData : data;
    if (exportData.length === 0) {
      toast.info("No data to export");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Availability");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileName = `availability_${new Date().toISOString().slice(0,10)}.xlsx`;
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
  };

  // Pagination calculations
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Add a state to handle hover for download button
  const [downloadHover, setDownloadHover] = useState(false);

  return (
    <div className="p-4 pt-0">
      {/* <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold hidden sm:block">Availability</h2>
      </div> */}

      {/* Desktop/Tablet Filters */}
      <div className="hidden sm:flex items-center space-x-2 mb-4 mt-2 justify-end">
        <Select
          options={itemCodeOptions}
          value={selectedItemCode}
          onChange={handleFilterChange}
          placeholder="Search by Item Code"
          isClearable
          className="w-64"
        />
        <button
          onClick={handleReset}
          className="px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
        >
          Reset
        </button>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
        >
          <RefreshIcon className="h-5 w-5" />
        </button>
        {/* Download Button with same styling as filter, show "Export" on hover */}
        <div
          className="relative"
          onMouseEnter={() => setDownloadHover(true)}
          onMouseLeave={() => setDownloadHover(false)}
        >
          <button
            onClick={handleDownloadExcel}
            className="p-2 rounded-md shadow-md bg-white border-2 flex items-center justify-center transition"
            style={{
              borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
              borderRadius: "8px"
            }}
            title="Export Excel"
          >
            <DownloadIcon className="h-6 w-6 text-blue-600" />
          </button> 
          {/* {downloadHover && (
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
              Export
            </span>
          )} */}
        </div>
      </div>

      {/* Mobile: Search + Filter Button Row */}
      <div className="sm:hidden flex items-center gap-2 mb-2 mt-2">
        <Select
          options={itemCodeOptions}
          value={selectedItemCode}
          onChange={handleFilterChange}
          placeholder="Search by Item Code"
          isClearable
          className="flex-1"
        />
        <button
          onClick={() => setShowFilterPopup(true)}
          className="p-2 rounded-md shadow-md bg-white border-2"
          style={{
            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
            borderRadius: "8px"
          }}
        >
          <FilterIcon className="h-6 w-6 text-blue-600" />
        </button>
        {/* Download Button for Mobile, show Export on hover */}
        <div
          className="relative"
          onMouseEnter={() => setDownloadHover(true)}
          onMouseLeave={() => setDownloadHover(false)}
        >
          <button
            onClick={handleDownloadExcel}
            className="p-2 rounded-md shadow-md bg-white border-2 flex items-center justify-center transition"
            style={{
              borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
              borderRadius: "8px"
            }}
            title="Download Excel"
          >
            <DownloadIcon className="h-6 w-6 text-blue-600" />
          </button>
          {downloadHover && (
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
              Export
            </span>
          )}
        </div>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <Box className="flex justify-center items-center h-64">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {filteredData.length === 0 ? (
            <p className="text-center text-gray-500">No data found</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <tr>
                      <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Bin Location</th>
                      <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Make</th>
                      <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Item Code</th>
                      <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Batch Number</th>
                      <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Available Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                        <td className="py-3 px-6 border-b border-gray-300 text-center">{row.bin_location}</td>
                        <td className="py-3 px-6 border-b border-gray-300 text-center">{row.make}</td>
                        <td className="py-3 px-6 border-b border-gray-300 text-center">{row.item_code}</td>
                        <td className="py-3 px-6 border-b border-gray-300 text-center">{row.batch_number}</td>
                        <td className="py-3 px-6 border-b border-gray-300 text-center">{row.available_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {currentRows.map((row, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                    <div className="flex justify-between text-sm mb-1">
                      <strong>Bin Location:</strong>
                      <span>{row.bin_location}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <strong>Make:</strong>
                      <span>{row.make}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <strong>Item Code:</strong>
                      <span>{row.item_code}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <strong>Batch Number:</strong>
                      <span>{row.batch_number}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <strong>Available Quantity:</strong>
                      <span>{row.available_quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 mx-1">{currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Filter Popup for Mobile */}
      {showFilterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-xs shadow-lg border-2"
            style={{
              borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
              borderRadius: "16px"
            }}
          >
            {/* Close Icon */}
            <button
              onClick={() => setShowFilterPopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center">Filters</h3>
            <div className="flex flex-col gap-3">
              <Select
                options={itemCodeOptions}
                value={selectedItemCode}
                onChange={handleFilterChange}
                placeholder="Search by Item Code"
                isClearable
                className="w-full"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                >
                  Reset
                </button>
                <button
                  onClick={() => { setShowFilterPopup(false); handleRefresh(); }}
                  className="flex-1 px-3 py-1 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default ViewPage;