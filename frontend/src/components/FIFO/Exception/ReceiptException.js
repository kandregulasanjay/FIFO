import React, { useState, useEffect } from 'react';
import { fetchReceiptExceptionData } from '../../../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ReceiptExceptionPage = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchData = async (receiptNum = '') => {
    setLoading(true);
    try {
      const response = await fetchReceiptExceptionData(receiptNum);
      setData(response);

      if (response.length > 0) {
        setColumns(Object.keys(response[0]));
      } else {
        setColumns([]);
      }
    } catch (error) {
      toast.error('Error fetching data');
      setData([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(receiptNumber);
    setCurrentPage(1);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold">Receipt Report</h2>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by Receipt Number"
            value={receiptNumber}
            onChange={e => setReceiptNumber(e.target.value)}
            className="border px-3 py-1 rounded-md"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => { setReceiptNumber(''); fetchData(); }}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
          >
            Reset
          </button>
        </form>
      </div>

      {loading ? (
        <Box className="flex justify-center items-center h-64">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {data.length === 0 ? (
            <p className="text-center text-gray-500">No data found</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition-all">
                      {columns.map(col => (
                        <td key={col} className="py-3 px-6 border-b border-gray-300 text-center">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-center mt-4" style={{ display: totalPages > 1 ? 'flex' : 'none' }}>
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
        </>
      )}
      <ToastContainer />
    </div>
  );
};

export default ReceiptExceptionPage;