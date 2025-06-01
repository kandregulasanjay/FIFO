import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { fetchReports, runReportQuery, fetchFilterOptions } from "../../api/api";

const ReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filters, setFilters] = useState({});
    const [filterOptions, setFilterOptions] = useState({});
    const [results, setResults] = useState([]);
    const [columns, setColumns] = useState([]);
    const { report_name } = useParams();

    useEffect(() => {
        const loadReports = async () => {
            try {
                const data = await fetchReports();
                setReports(data);

                const report = data.find((r) => r.report_name === report_name);
                if (report) {
                    setSelectedReport(report);
                    await loadFilterOptions(report);
                    await fetchReport(report);
                }
            } catch (error) {
                console.error("Error loading reports:", error.message);
            }
        };
        loadReports();
    }, [report_name]);

    const loadFilterOptions = async (report) => {
        const options = {};

        const tableNameMatch = report.report_query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
        const tableName = tableNameMatch ? tableNameMatch[1] : null;

        if (!tableName) {
            console.error("Table name could not be extracted from report_query.");
            return;
        }

        for (let i = 1; i <= 10; i++) {
            const key = `filter${i}`;
            const field = report[key];
            const type = report[`${key}_type`];

            if (field && type === "dropdown") {
                try {
                    const data = await fetchFilterOptions(field, tableName);
                    options[key] = data.map((item) => ({ value: item, label: item }));
                } catch (error) {
                    console.error(`Error fetching options for ${field}:`, error.message);
                }
            }
        }

        setFilterOptions(options);
    };

    const handleFilterChange = (key, selectedOption) => {
        const value = selectedOption ? selectedOption.value : "";
        setFilters((prev) => {
            const updatedFilters = { ...prev, [key]: value };
            fetchReport(selectedReport, updatedFilters);
            return updatedFilters;
        });
    };

    const fetchReport = async (report = selectedReport, appliedFilters = filters) => {
        if (!report) return;

        try {
            const data = await runReportQuery(report.id, appliedFilters);
            setColumns(data.columns);
            setResults(data.rows);
        } catch (error) {
            console.error("Error fetching report data:", error.message);
        }
    };

    const renderFilters = () => {
        if (!selectedReport) return null;

        const inputs = [];
        for (let i = 1; i <= 10; i++) {
            const key = `filter${i}`;
            const label = selectedReport[key];
            const type = selectedReport[`${key}_type`] || "text";

            if (label) {
                inputs.push(
                    <div
                        key={key}
                        className="flex flex-col mb-4 w-full sm:w-1/2 lg:w-1/4 px-2"
                    >
                        <label className="mb-1 text-xs font-medium text-gray-700">{label}</label>
                        {type === "dropdown" ? (
                            <Select
                                options={filterOptions[key]}
                                value={filterOptions[key]?.find((opt) => opt.value === filters[key]) || null}
                                onChange={(selectedOption) => handleFilterChange(key, selectedOption)}
                                placeholder={`Select ${label}`}
                                isClearable
                                styles={{
                                    container: (base) => ({
                                        ...base,
                                        width: "100%",
                                        fontSize: "10px",
                                    }),
                                    control: (base) => ({
                                        ...base,
                                        minHeight: "30px",
                                        fontSize: "10px", 
                                        padding: "0 4px", 
                                        borderRadius: "4px",
                                        borderColor: "#d1d5db",
                                    }),
                                    valueContainer: (base) => ({
                                        ...base,
                                        padding: "2px 4px",
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        fontSize: "10px",
                                        padding: "0", 
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        fontSize: "10px", 
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        fontSize: "10px", 
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        padding: "2px",
                                    }),
                                    clearIndicator: (base) => ({
                                        ...base,
                                        padding: "2px", 
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        fontSize: "10px", 
                                    }),
                                }}
                            />
                        ) : (
                            <input
                                type={type === "date" ? "date" : "text"}
                                value={filters[key] || ""}
                                onChange={(e) => handleFilterChange(key, { value: e.target.value })}
                                className="border border-gray-300 rounded-md p-1 text-xs h-6" 
                            />
                        )}
                    </div>
                );
            }
        }
        return inputs;
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {selectedReport && (
                <h2 className="text-2xl font-bold mb-6 text-center">
                    {selectedReport.report_name}
                </h2>
            )}

            {selectedReport && (
                <>
                    <div className="flex flex-wrap -mx-2 mb-6">
                        {renderFilters()}
                    </div>

                    {/* Results Table */}
                    {results.length > 0 ? (
                        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                            <table className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                    <tr>
                                        {columns.map((col, i) => (
                                            <th
                                                key={i}
                                                className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300"
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((row, idx) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50 transition-all">
                                            {columns.map((col, i) => (
                                                <td
                                                    key={i}
                                                    className="py-3 px-6 border-b border-gray-300 text-center"
                                                >
                                                    {row[col]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 mt-4">
                            <i>No data available. Adjust the filters above.</i>
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportsPage;
