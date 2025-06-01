import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { fetchReports, runReportQuery, fetchFilterOptions } from "../../api/api";
import DonutChart from "./Charts/DonutChart";
import LineChart from "./Charts/LineChart";
import BarChart from "./Charts/BarChart";

const ReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filters, setFilters] = useState({});
    const [filterOptions, setFilterOptions] = useState({});
    const [results, setResults] = useState([]);
    const [columns, setColumns] = useState([]);
    const [chartFields, setChartFields] = useState([]);
    const [chartConfig, setChartConfig] = useState({
        donut: { xField: null, yField: null, aggregation: "sum" },
        line: { xField: null, yField: null, aggregation: "sum" },
        bar: { xField: null, yField: null, aggregation: "sum" },
    });
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
                    extractFieldsFromTable(report.report_query);
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

    const extractFieldsFromTable = async (query) => {
        const tableNameMatch = query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
        const tableName = tableNameMatch ? tableNameMatch[1] : null;

        if (!tableName) {
            console.error("Table name could not be extracted from report_query.");
            return;
        }

        try {
            // Fetch all fields (columns) from the table
            const fields = await fetchFilterOptions("*", tableName);
            setChartFields(fields.map((field) => ({ value: field, label: field })));
        } catch (error) {
            console.error("Error fetching fields:", error.message);
        }
    };

    const handleChartConfigChange = (chartType, key, value) => {
        setChartConfig((prev) => ({
            ...prev,
            [chartType]: {
                ...prev[chartType],
                [key]: value,
            },
        }));
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

    const handleFilterChange = (filterKey, value) => {
        setFilters((prev) => ({
            ...prev,
            [filterKey]: value,
        }));
    };

    const applyFilters = () => {
        if (selectedReport) {
            fetchReport(selectedReport, filters); // Fetch report with updated filters
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
                                onChange={(selectedOption) => handleFilterChange(key, selectedOption?.value || null)}
                                placeholder={`Select ${label}`}
                                isClearable
                            />
                        ) : (
                            <input
                                type={type === "date" ? "date" : "text"}
                                value={filters[key] || ""}
                                onChange={(e) => handleFilterChange(key, e.target.value)}
                                className="border border-gray-300 rounded-md p-1 text-xs h-6"
                            />
                        )}
                    </div>
                );
            }
        }
        return inputs;
    };

    const renderChartControls = (chartType) => (
        <div className="flex flex-wrap mb-4">
            <div className="w-1/3 px-2">
                <label className="block text-sm font-medium text-gray-700">X-Axis</label>
                <Select
                    options={chartFields}
                    value={chartFields.find((opt) => opt.value === chartConfig[chartType].xField) || null}
                    onChange={(selectedOption) =>
                        handleChartConfigChange(chartType, "xField", selectedOption?.value || null)
                    }
                    placeholder="Select X-Axis"
                />
            </div>
            <div className="w-1/3 px-2">
                <label className="block text-sm font-medium text-gray-700">Y-Axis</label>
                <Select
                    options={chartFields}
                    value={chartFields.find((opt) => opt.value === chartConfig[chartType].yField) || null}
                    onChange={(selectedOption) =>
                        handleChartConfigChange(chartType, "yField", selectedOption?.value || null)
                    }
                    placeholder="Select Y-Axis"
                />
            </div>
            <div className="w-1/3 px-2">
                <label className="block text-sm font-medium text-gray-700">Aggregation</label>
                <Select
                    options={[
                        { value: "sum", label: "Sum" },
                        { value: "avg", label: "Average" },
                        { value: "count", label: "Count" },
                        { value: "min", label: "Min" },
                        { value: "max", label: "Max" },
                    ]}
                    value={
                        [
                            { value: "sum", label: "Sum" },
                            { value: "avg", label: "Average" },
                            { value: "count", label: "Count" },
                            { value: "min", label: "Min" },
                            { value: "max", label: "Max" },
                        ].find((opt) => opt.value === chartConfig[chartType].aggregation) || null
                    }
                    onChange={(selectedOption) =>
                        handleChartConfigChange(chartType, "aggregation", selectedOption?.value || null)
                    }
                    placeholder="Select Aggregation"
                />
            </div>
        </div>
    );

    const renderChart = (chartType, ChartComponent) => {
        const { xField, yField, aggregation } = chartConfig[chartType];

        if (!xField || !yField || results.length === 0) {
            return <p className="text-gray-500">Please select valid fields and apply filters to view the chart.</p>;
        }

        // Apply aggregation to the y-axis data
        const aggregatedData = results.reduce((acc, row) => {
            const xValue = row[xField];
            const yValue = parseFloat(row[yField]) || 0;

            if (!acc[xValue]) acc[xValue] = [];
            acc[xValue].push(yValue);

            return acc;
        }, {});

        const chartData = Object.entries(aggregatedData).map(([key, values]) => {
            let aggregatedValue;
            switch (aggregation) {
                case "sum":
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                    break;
                case "avg":
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                    break;
                case "count":
                    aggregatedValue = values.length;
                    break;
                case "min":
                    aggregatedValue = Math.min(...values);
                    break;
                case "max":
                    aggregatedValue = Math.max(...values);
                    break;
                default:
                    aggregatedValue = 0;
            }
            return { [xField]: key, [yField]: aggregatedValue };
        });

        return (
            <ChartComponent
                data={chartData}
                xField={xField}
                yField={yField}
                title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
            />
        );
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
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded mb-6"
                        onClick={applyFilters}
                    >
                        Apply Filters
                    </button>

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

                    {/* Donut Chart */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Donut Chart</h3>
                        {renderChartControls("donut")}
                        {renderChart("donut", DonutChart)}
                    </div>

                    {/* Line Chart */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Line Chart</h3>
                        {renderChartControls("line")}
                        {renderChart("line", LineChart)}
                    </div>

                    {/* Bar Chart */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Bar Chart</h3>
                        {renderChartControls("bar")}
                        {renderChart("bar", BarChart)}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsPage;
