import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchSimpleFormMenus, fetchSurveyFormMenus, fetchFormNames, fetchSurveyFormNames, fetchReportMenus } from "../../../api/api";
import { FaChevronDown, FaChevronUp, FaAngleDoubleDown, FaAngleDoubleUp } from "react-icons/fa";

const Sidebar = () => {
    const [surveyMenus, setSurveyMenus] = useState([]);
    const [formMenus, setFormMenus] = useState([]);
    const [formSubMenus, setFormSubMenus] = useState({});
    const [surveySubMenus, setSurveySubMenus] = useState({});
    const [reportMenus, setReportMenus] = useState({});
    const [collapsedMenus, setCollapsedMenus] = useState({});
    const [collapsedMainMenus, setCollapsedMainMenus] = useState({});
    const [collapsedSubMenus, setCollapsedSubMenus] = useState({});

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const [simpleMenus, surveyMenusData, forms, surveys, reportData] = await Promise.all([
                    fetchSimpleFormMenus(),
                    fetchSurveyFormMenus(),
                    fetchFormNames(),
                    fetchSurveyFormNames(),
                    fetchReportMenus(),
                ]);
                setFormMenus(simpleMenus);
                setSurveyMenus(surveyMenusData);
                setFormSubMenus(forms.reduce((acc, form) => {
                    acc[form.Menu] = acc[form.Menu] || [];
                    acc[form.Menu].push(form.FormName);
                    return acc;
                }, {}));
                setSurveySubMenus(surveys.reduce((acc, survey) => {
                    acc[survey.Menu] = acc[survey.Menu] || [];
                    acc[survey.Menu].push(survey.SurveyFormName);
                    return acc;
                }, {}));
                const groupedMenus = reportData.reduce((acc, item) => {
                    acc[item.menu] = acc[item.menu] || [];
                    acc[item.menu].push(item);
                    return acc;
                }, {});
                setReportMenus(groupedMenus);
            } catch (error) {
                console.error("Error fetching menus:", error.message);
            }
        };
        fetchMenus();
    }, []);

    const toggleMenu = (menu) => {
        setCollapsedMenus((prev) => ({
            ...prev,
            [menu]: !prev[menu],
        }));
    };

    const toggleMainMenu = (menu) => {
        setCollapsedMainMenus((prev) => ({
            ...prev,
            [menu]: !prev[menu],
        }));
    };

    const toggleSubMenu = (menu, subMenu) => {
        setCollapsedSubMenus((prev) => ({
            ...prev,
            [`${menu}-${subMenu}`]: !prev[`${menu}-${subMenu}`],
        }));
    };

    return (
        <div
            className="fixed top-0 left-0 h-screen bg-gradient-to-b from-blue-800 to-blue-600 text-white p-4 shadow-lg md:relative md:w-64"
        >
            <div
                className="h-full overflow-y-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                <style>
                    {`
                        ::-webkit-scrollbar {
                            display: none; 
                        }
                    `}
                </style>
                {/* Bin Allocation Management */}
                <div className="mb-6">
                    <div
                        className="flex justify-between items-center cursor-pointer text-lg font-bold mb-4 border-b border-blue-400 pb-2"
                        onClick={() => toggleMainMenu("binAllocation")}
                    >
                        <h2>Bin Allocation</h2>
                        {collapsedMainMenus["binAllocation"] ? <FaAngleDoubleUp style={{ fontSize: "0.8em" }} /> : <FaAngleDoubleDown style={{ fontSize: "0.8em" }} />}
                    </div>
                    {collapsedMainMenus["binAllocation"] && (
                        <ul className="space-y-2">
                            <li>
                                <div
                                    className="flex justify-between items-center cursor-pointer text-base hover:text-blue-200" // Menu font size
                                    onClick={() => toggleMenu("receipts")}
                                >
                                    <h3 className="font-semibold">Receipts</h3>
                                    {collapsedMenus["receipts"] ? <FaChevronUp style={{ fontSize: "0.8em" }} /> : <FaChevronDown style={{ fontSize: "0.8em" }} />}
                                </div>
                                {collapsedMenus["receipts"] && (
                                    <ul className="ml-4 mt-2 space-y-1 text-sm">
                                        <li><Link to="/pending-receipts" className="hover:text-blue-200">Pending Receipts</Link></li>
                                        <li><Link to="/receipt-allocation" className="hover:text-blue-200">Complete Receipts</Link></li>
                                    </ul>
                                )}
                            </li>
                            <li>
                                <div
                                    className="flex justify-between items-center cursor-pointer text-base hover:text-blue-200"
                                    onClick={() => toggleMenu("pickslip")}
                                >
                                    <h3 className="font-semibold">Pickslip</h3>
                                    {collapsedMenus["pickslip"] ? <FaChevronUp style={{ fontSize: "0.8em" }} /> : <FaChevronDown style={{ fontSize: "0.8em" }} />}
                                </div>
                                {collapsedMenus["pickslip"] && (
                                    <ul className="ml-4 mt-2 space-y-1 text-sm">
                                        <li><Link to="/pending-pickslip" className="hover:text-blue-200">Pending Pickslip</Link></li>
                                        <li><Link to="/pickslip-allocation" className="hover:text-blue-200">Complete Pickslip</Link></li>
                                    </ul>
                                )}
                            </li>
                            <li>
                                <div
                                    className="flex justify-between items-center cursor-pointer text-base hover:text-blue-200"
                                    onClick={() => toggleMenu("holding")}
                                >
                                    <h3 className="font-semibold">Holding</h3>
                                    {collapsedMenus["holding"] ? <FaChevronUp style={{ fontSize: "0.8em" }} /> : <FaChevronDown style={{ fontSize: "0.8em" }} />}
                                </div>
                                {collapsedMenus["holding"] && (
                                    <ul className="ml-4 mt-2 space-y-1 text-sm">
                                         <li><Link to="/holding" className="hover:text-blue-200">Holding</Link></li>
                                          <li><Link to="/completed-holding" className="hover:text-blue-200">Completed Holdings</Link></li>
                                    </ul>
                                )}
                            </li>
                            <li>
                                <div
                                    className="flex justify-between items-center cursor-pointer text-base hover:text-blue-200"
                                    onClick={() => toggleMenu("movements")}
                                >
                                    <h3 className="font-semibold">Movements</h3>
                                    {collapsedMenus["movements"] ? <FaChevronUp style={{ fontSize: "0.8em" }} /> : <FaChevronDown style={{ fontSize: "0.8em" }} />}
                                </div>
                                {collapsedMenus["movements"] && (
                                    <ul className="ml-4 mt-2 space-y-1 text-sm">
                                        <li><Link to="/adjustment" className="hover:text-blue-200">Adjustment</Link></li>                                       
                                        <li><Link to="/reserve" className="hover:text-blue-200">Reserve</Link></li>
                                        <li><Link to="/transfer" className="hover:text-blue-200">Transfer</Link></li>
                                        <li><Link to="/manual-report" className="hover:text-blue-200">Manual Report</Link></li>
                                        <li><Link to="/lead-capture" className="hover:text-blue-200">Lead</Link></li>
                                    </ul>
                                )}
                            </li>
                            <li><Link to="/view" className="text-lg hover:text-blue-200">Availability</Link></li>
                            <li><Link to="/doc" className="text-lg hover:text-blue-200">Document</Link></li>
                        </ul>
                    )}
                </div>

                {/* Survey Application */}
                <div className="mb-6">
                    <div
                        className="flex justify-between items-center cursor-pointer text-lg font-bold mb-4 border-b border-blue-400 pb-2"
                        onClick={() => toggleMainMenu("surveys")}
                    >
                        <h2>Surveys</h2>
                        {collapsedMainMenus["surveys"] ? <FaAngleDoubleUp style={{ fontSize: "0.8em" }} /> : <FaAngleDoubleDown style={{ fontSize: "0.8em" }} />}
                    </div>
                    {collapsedMainMenus["surveys"] && (
                        <ul className="space-y-2">
                            {surveyMenus.map((menu) => (
                                <li key={menu}>
                                    <div
                                        className="flex justify-between items-center cursor-pointer text-base hover:text-blue-200"
                                        onClick={() => toggleMenu(menu)}
                                    >
                                        <h3 className="font-semibold">{menu}</h3>
                                        {collapsedMenus[menu] ? <FaChevronUp style={{ fontSize: "0.8em" }} /> : <FaChevronDown style={{ fontSize: "0.8em" }} />}
                                    </div>
                                    {collapsedMenus[menu] && (
                                        <ul className="ml-4 mt-2 space-y-1 text-sm">
                                            {surveySubMenus[menu]?.map((survey) => (
                                                <li key={survey}>
                                                    <Link to={`/survey-form/${encodeURIComponent(survey)}`} className="hover:text-blue-200">{survey}</Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Fleet Section */}
                <div className="mb-6">
                    <div
                        className="flex justify-between items-center cursor-pointer text-lg font-bold mb-4 border-b border-blue-400 pb-2"
                        onClick={() => toggleMainMenu("fleet")}
                    >
                        <h2>Fleet</h2>
                        {collapsedMainMenus["fleet"] ? <FaAngleDoubleUp style={{ fontSize: "0.8em" }} /> : <FaAngleDoubleDown style={{ fontSize: "0.8em" }} />}
                    </div>
                    {collapsedMainMenus["fleet"] && (
                        <ul className="space-y-2">
                            <li><Link to="/lead-capture" className="hover:text-blue-200">Lead</Link></li>
                            <li><Link to="/pending-leads" className="hover:text-blue-200">Pending Leads</Link></li>
                            <li><Link to="/quotation-leads" className="hover:text-blue-200">Quotation Leads</Link></li>
                        </ul>
                    )}
                </div>

                {/* Forms Application */}
                <div>
                    <div
                        className="flex justify-between items-center cursor-pointer text-lg font-bold mb-4 border-b border-blue-400 pb-2"
                        onClick={() => toggleMainMenu("leasing")}
                    >
                        <h2>Vehicle Sales</h2>
                        {collapsedMainMenus["leasing"] ? <FaAngleDoubleUp style={{ fontSize: "0.8em" }} /> : <FaAngleDoubleDown style={{ fontSize: "0.8em" }} />}
                    </div>
                    {collapsedMainMenus["leasing"] && (
                        <ul className="space-y-2">
                            {formMenus.map((menu) => (
                                <li key={menu}>
                                    <div
                                        className="flex justify-between items-center cursor-pointer text-base hover:text-blue-200"
                                        onClick={() => toggleMenu(menu)}
                                    >
                                        <h3 className="font-semibold">{menu}</h3>
                                        {collapsedMenus[menu] ? <FaChevronUp style={{ fontSize: "0.8em" }} /> : <FaChevronDown style={{ fontSize: "0.8em" }} />}
                                    </div>
                                    {collapsedMenus[menu] && (
                                        <ul className="ml-4 mt-2 space-y-1 text-sm">
                                            {formSubMenus[menu]?.map((form) => (
                                                <li key={form}>
                                                    <Link to={`/form/${encodeURIComponent(form)}`} className="hover:text-blue-200">{form}</Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Reports Section */}
                <div className="mb-6">
                    <div
                        className="flex justify-between items-center cursor-pointer text-lg font-bold mb-4 border-b border-blue-400 pb-2"
                        onClick={() => toggleMainMenu("reports")}
                    >
                        <h2>Reports</h2>
                        {collapsedMainMenus["reports"] ? <FaAngleDoubleUp style={{ fontSize: "0.8em" }} /> : <FaAngleDoubleDown style={{ fontSize: "0.8em" }} />}
                    </div>
                    {collapsedMainMenus["reports"] && (
                        <ul className="space-y-2">
                            {Object.keys(reportMenus).map((menu) => (
                                <li key={menu}>
                                    <div
                                        className="flex justify-between items-center cursor-pointer text-base hover:text-blue-200"
                                        onClick={() => toggleMenu(menu)}
                                    >
                                        <h3 className="font-semibold">{menu}</h3>
                                        {collapsedMenus[menu] ? <FaChevronUp style={{ fontSize: "0.8em" }} /> : <FaChevronDown style={{ fontSize: "0.8em" }} />}
                                    </div>
                                    {collapsedMenus[menu] && (
                                        <ul className="ml-4 mt-2 space-y-1 text-sm">
                                            {reportMenus[menu]?.map((submenu) => (
                                                <li key={submenu.sub_menu}>
                                                    <div
                                                        className="flex justify-between items-center cursor-pointer hover:text-blue-200"
                                                        onClick={() => toggleSubMenu(menu, submenu.sub_menu)}
                                                    >
                                                        <h4>{submenu.sub_menu}</h4>
                                                        {collapsedSubMenus[`${menu}-${submenu.sub_menu}`] ? (
                                                            <FaChevronUp />
                                                        ) : (
                                                            <FaChevronDown />
                                                        )}
                                                    </div>
                                                    {collapsedSubMenus[`${menu}-${submenu.sub_menu}`] && (
                                                        <ul className="ml-4 mt-2 space-y-1 text-sm">
                                                            <li>
                                                                <Link
                                                                    to={`/report/${encodeURIComponent(
                                                                        menu
                                                                    )}/${encodeURIComponent(
                                                                        submenu.sub_menu
                                                                    )}/${encodeURIComponent(
                                                                        submenu.report_name
                                                                    )}`}
                                                                    className="hover:text-blue-200"
                                                                >
                                                                    {submenu.report_name}
                                                                </Link>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
