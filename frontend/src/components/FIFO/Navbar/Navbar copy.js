import React, { useState } from "react";
import {  FaSignOutAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Link } from "react-router-dom";

const Navbar = ({ onLogout, onToggleSidebar }) => {
    const [activeMenu, setActiveMenu] = useState(null);

    const toggleMenu = (menu) => {
        setActiveMenu((prev) => (prev === menu ? null : menu));
    };

    const handleMenuClick = () => {
        setActiveMenu(null); // Close the menu after selection
    };

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg relative">
            {/* Desktop & Tablet Navbar */}
            <div className="hidden md:flex justify-between items-center mx-auto">
                <div className="flex items-center space-x-4">
                    <div className="text-white text-2xl font-bold tracking-wide">
                        AL BABTAIN
                    </div>
                </div>

                {/* Menus */}
                <div className="flex space-x-6">
                    {/* Receipt Menu */}
                    <div className="relative">
                        <div
                            className="text-white text-lg cursor-pointer flex items-center"
                            onClick={() => toggleMenu("receipts")}
                        >
                            Receipt
                            {activeMenu === "receipts" ? (
                                <FaChevronUp size={12} className="ml-1" />
                            ) : (
                                <FaChevronDown size={12} className="ml-1" />
                            )}
                        </div>
                        {activeMenu === "receipts" && (
                            <ul className="absolute bg-white text-gray-800 shadow-lg rounded-md mt-2 w-48 z-10">
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/pending-receipts"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Pending Receipts
                                    </Link>
                                </li>
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/receipt-allocation"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Complete Receipts
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </div>

                    {/* Pickslip Menu */}
                    <div className="relative">
                        <div
                            className="text-white text-lg cursor-pointer flex items-center"
                            onClick={() => toggleMenu("pickslip")}
                        >
                            Pickslip
                            {activeMenu === "pickslip" ? (
                                <FaChevronUp size={12} className="ml-1" />
                            ) : (
                                <FaChevronDown size={12} className="ml-1" />
                            )}
                        </div>
                        {activeMenu === "pickslip" && (
                            <ul className="absolute bg-white text-gray-800 shadow-lg rounded-md mt-2 w-48 z-10">
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/pending-pickslip"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Pending Pickslip
                                    </Link>
                                </li>
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/pickslip-allocation"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Complete Pickslip
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </div>

                    {/* Holding Menu */}
                    <div className="relative">
                        <div
                            className="text-white text-lg cursor-pointer flex items-center"
                            onClick={() => toggleMenu("holding")}
                        >
                            Holding
                            {activeMenu === "holding" ? (
                                <FaChevronUp size={12} className="ml-1" />
                            ) : (
                                <FaChevronDown size={12} className="ml-1" />
                            )}
                        </div>
                        {activeMenu === "holding" && (
                            <ul className="absolute bg-white text-gray-800 shadow-lg rounded-md mt-2 w-48 z-10">
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/holding"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Pending Holding
                                    </Link>
                                </li>
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/completed-holding"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Complete Holding
                                    </Link>
                                </li>
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/holding-transfer"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Holding Transfer
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </div>

                    {/* Movements Menu */}
                    <div className="relative">
                        <div
                            className="text-white text-lg cursor-pointer flex items-center"
                            onClick={() => toggleMenu("movements")}
                        >
                            Movements
                            {activeMenu === "movements" ? (
                                <FaChevronUp size={12} className="ml-1" />
                            ) : (
                                <FaChevronDown size={12} className="ml-1" />
                            )}
                        </div>
                        {activeMenu === "movements" && (
                            <ul className="absolute bg-white text-gray-800 shadow-lg rounded-md mt-2 w-48 z-10">
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/adjustment"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Adjustment
                                    </Link>
                                </li>
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/transfer"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Transfer
                                    </Link>
                                </li>
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/reserve"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Reserve
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </div>

                    {/* Reports Menu */}
                    <div className="relative">
                        <div
                            className="text-white text-lg cursor-pointer flex items-center"
                            onClick={() => toggleMenu("exceptions")}
                        >
                            Reports
                            {activeMenu === "exceptions" ? (
                                <FaChevronUp size={12} className="ml-1" />
                            ) : (
                                <FaChevronDown size={12} className="ml-1" />
                            )}
                        </div>
                        {activeMenu === "exceptions" && (
                            <ul className="absolute bg-white text-gray-800 shadow-lg rounded-md mt-2 w-48 z-10">
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/pickslip-exception"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Pickslips
                                    </Link>
                                </li>
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/receipt-exception"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Receipts
                                    </Link>
                                </li>  
                                <li className="hover:bg-gray-100">
                                    <Link
                                        to="/holding-report"
                                        className="block px-4 py-2 hover:text-purple-500"
                                        onClick={handleMenuClick}
                                    >
                                        Holding
                                    </Link>
                                </li>                                 
                            </ul>
                        )}
                    </div>

                    {/* Availability Menu */}
                    <div>
                        <Link
                            to="/view"
                            className="text-white text-lg hover:text-purple-300"
                            onClick={handleMenuClick}
                        >
                            Availability
                        </Link>
                    </div>
                        {/* Document Menu */}
                    <div>
                        <Link
                            to="/doc"
                            className="text-white text-lg hover:text-purple-300"
                            onClick={handleMenuClick}
                        >
                            Help
                        </Link>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={onLogout}
                    className="flex items-center text-white px-4 py-1 border border-white rounded-md hover:bg-white hover:text-purple-600 transition-transform transform hover:scale-105"
                >
                    <FaSignOutAlt className="mr-2" />
                    Logout
                </button>
            </div>

            {/* Mobile Navbar */}
            <div className="flex md:hidden justify-between items-center">
                <div className="text-white text-2xl font-bold tracking-wide">
                    AL BABTAIN
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center text-white px-4 py-1 border border-white rounded-md hover:bg-white hover:text-purple-600 transition-transform transform hover:scale-105"
                >
                    <FaSignOutAlt className="mr-2" />
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
