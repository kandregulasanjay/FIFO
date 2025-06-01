import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Navbar from "./components/FIFO/Navbar/Navbar";
import Sidebar from "./components/FIFO/Navbar/Sidebar";
import OrderAllocation from "./components/FIFO/Orders/OrderAllocation";
import PendingOrders from "./components/FIFO/Orders/PendingOrders";
import PendingReceipts from "./components/FIFO/Receipts/PendingReceipts";
import OrderDetails from "./components/FIFO/Orders/OrdersDetails";
import PendingDetails from "./components/FIFO/Receipts/ReceiptsDetails";
import ReceiptAllocation from "./components/FIFO/Receipts/ReceiptAllocation";
import ViewPage from "./components/FIFO/Availability/ViewPage";
import TransferPage from "./components/FIFO/Transfer/TransferPage";
import HoldingPage from "./components/FIFO/Holding/HoldingPage";
import HoldingDetailsPage from "./components/FIFO/Holding/HoldingDetails";
import CompletedHoldingPage from "./components/FIFO/Holding/CompletedHoldingPage";
import HoldingTransferPage from "./components/FIFO/Holding/HoldingTransferPage";
import AdjustmentPage from "./components/FIFO/Adjustment/AdjustmentPage";

import AuthPage from "./components/FIFO/Auth/AuthPage";
import SessionTimeoutPopup from './components/FIFO/Auth/SessionTimeoutPopup';
import useSessionTimeout from './components/FIFO/Auth/useSessionTimeout';

import ReservePage from './components/FIFO/Reserve/ReservePage';
import { logUserAction, logoutUser, fetchSimpleFormMenus, fetchSurveyFormMenus, fetchFormNames, fetchSurveyFormNames } from './api/api';
import DynamicForm from './components/FORMS/DynamicForm';
import DynamicSurveyForm from './components/FORMS/DynamicSurveyForm';
import ReportsPage from './components/REPORTS/ReportsPage';
import ManualPage from './components/MANUAL REPORTS/manualPage';
import LeadCapturePage from './components/FLEET/LeadCapturePage';
import PendingLeadsPage from "./components/FLEET/PendingLeadsPage";
import QuatationPage from "./components/FLEET/QuatationPage";

import Document from "./components/FIFO/document.js";

import PickslipExceptionPage from "./components/FIFO/Exception/PickslipException.js";
import ReceiptExceptionPage from "./components/FIFO/Exception/ReceiptException.js";
import HoldingReportPage from "./components/FIFO/Exception/HoldingReport.js";

import BottomTabs from "./components/FIFO/Navbar/BottomTabs";
import PickslipTabs from "./components/FIFO/Orders/PickslipTabs";
import ReceiptsTabs from "./components/FIFO/Receipts/ReceiptsTabs";
import MoreTabs from "./components/FIFO/Availability/MoreTabs";
import HoldingTabs from "./components/FIFO/Holding/HoldingTabs";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#1976d2" },
        secondary: { main: "#dc004e" },
    },
    typography: {
        fontFamily: "'Outfit', sans-serif",
    },
});

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formMenus, setFormMenus] = useState([]);
    const [surveyMenus, setSurveyMenus] = useState([]);
    const [formNames, setFormNames] = useState([]);
    const [surveyFormNames, setSurveyFormNames] = useState([]);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            const fetchData = async () => {
                try {
                    const [simpleMenus, surveyMenusData, forms, surveys] = await Promise.all([
                        fetchSimpleFormMenus(),
                        fetchSurveyFormMenus(),
                        fetchFormNames(),
                        fetchSurveyFormNames(),
                    ]);
                    setFormMenus(simpleMenus);
                    setSurveyMenus(surveyMenusData);
                    setFormNames(forms);
                    setSurveyFormNames(surveys);
                } catch (error) {
                    console.error("Error fetching data:", error.message);
                }
            };
            fetchData();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
            logUserAction('User logged out');
            localStorage.removeItem('token');
            setIsLoggedIn(false);
            window.location.replace("/auth");
        } catch (error) {
            console.error('Error during logout:', error.message);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const PrivateRoute = ({ children }) => {
        if (!localStorage.getItem('token')) {
            return <Navigate to="/auth" replace />;
        }
        return children;
    };

    useEffect(() => {
        console.log("Navbar Props:", { formMenus, surveyMenus, formNames, surveyFormNames });
    }, [formMenus, surveyMenus, formNames, surveyFormNames]);

    useSessionTimeout(isLoggedIn);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <SessionTimeoutPopup />
                {isLoggedIn && (
                    <>
                        <Navbar
                            onLogout={handleLogout}
                            onToggleSidebar={toggleSidebar}
                            isSidebarOpen={isSidebarOpen}
                        />
                        <div className="flex">
                            {isSidebarOpen && (
                                <div ref={sidebarRef}>
                                    <Sidebar />
                                </div>
                            )}
                            <div className="flex-grow">
                                <Routes>
                                    <Route path="/" element={<Navigate to={isLoggedIn ? "/pending-pickslip" : "/auth"} replace />} />                                    <Route path="/pickslip/:pickslipNumber" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
                                    <Route element={<PrivateRoute><PickslipTabs /></PrivateRoute>}>
                                        <Route path="/pending-pickslip" element={<PendingOrders />} />
                                        <Route path="/pickslip-allocation" element={<OrderAllocation />} />
                                        <Route path="/pickslip/:pickslipNumber" element={<OrderDetails />} />
                                    </Route>
                                    <Route element={<PrivateRoute><ReceiptsTabs /></PrivateRoute>}>
                                        <Route path="/pending-receipts" element={<PendingReceipts />} />
                                        <Route path="/receipt-allocation" element={<ReceiptAllocation />} />
                                        <Route path="/receipts/:receiptNumber" element={<PendingDetails />} />
                                    </Route>
                                    <Route element={<PrivateRoute><MoreTabs /></PrivateRoute>}>
                                        <Route path="/view" element={<PrivateRoute><ViewPage /></PrivateRoute>} />
                                        <Route path="/doc" element={<PrivateRoute><Document /></PrivateRoute>} />
                                        <Route path="/reserve" element={<PrivateRoute><ReservePage /></PrivateRoute>} />
                                        <Route path="/transfer" element={<PrivateRoute><TransferPage /></PrivateRoute>} />
                                        <Route path="/adjustment" element={<PrivateRoute><AdjustmentPage /></PrivateRoute>} />
                                    </Route>
                                    <Route element={<PrivateRoute><HoldingTabs /></PrivateRoute>}>
                                        <Route path="/holding" element={<HoldingPage />} />
                                        <Route path="/holding/:invoiceNumber" element={<HoldingDetailsPage />} />
                                        <Route path="/completed-holding" element={<CompletedHoldingPage />} />
                                        <Route path="/holding-transfer" element={<HoldingTransferPage />} />
                                    </Route>

                                    <Route path="/pickslip-exception" element={<PrivateRoute><PickslipExceptionPage /></PrivateRoute>} />
                                    <Route path="/receipt-exception" element={<PrivateRoute><ReceiptExceptionPage /></PrivateRoute>} />
                                    <Route path="/holding-report" element={<PrivateRoute><HoldingReportPage /></PrivateRoute>} />

                                    {/* FORMS & SURVEY FORMS */}
                                    <Route path="/form/:formName" element={<DynamicForm formTypeId={1} />} />
                                    <Route path="/form/:formName/:searchParam" element={<DynamicForm formTypeId={1} />} />
                                    <Route path="/survey-form/:surveyFormName" element={<DynamicSurveyForm formTypeId={2} />} />
                                    <Route
                                        path="/report/:menu/:sub_menu/:report_name"
                                        element={<PrivateRoute><ReportsPage /></PrivateRoute>}
                                    />
                                    <Route path="/manual-report" element={<PrivateRoute><ManualPage /></PrivateRoute>} />

                                    <Route path="/lead-capture" element={<PrivateRoute><LeadCapturePage /></PrivateRoute>} />
                                    <Route path="/pending-leads" element={<PrivateRoute><PendingLeadsPage /></PrivateRoute>} />
                                    <Route path="/lead-capture/:leadId" element={<PrivateRoute><LeadCapturePage /></PrivateRoute>} />
                                    <Route path="/quotation-leads" element={<PrivateRoute><QuatationPage /></PrivateRoute>} />
                                </Routes>
                            </div>
                        </div>
                        <div className="md:hidden pb-14" >
                            <BottomTabs />
                        </div>
                    </>
                )}
                {!isLoggedIn && (
                    <Routes>
                        <Route path="/" element={<Navigate to="/auth" replace />} />
                        <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
                    </Routes>
                )}
            </Router>
        </ThemeProvider>
    );
};

export default App;
