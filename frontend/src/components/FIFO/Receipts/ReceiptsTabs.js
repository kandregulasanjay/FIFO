import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import classNames from "classnames";

const tabs = [
  { label: "Pending Receipts", path: "/pending-receipts" },
  { label: "Completed Receipts", path: "/receipt-allocation" },
];

const ReceiptTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={classNames(
              "px-4 py-2 text-sm font-semibold focus:outline-none transition",
              location.pathname === tab.path
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <Outlet />
    </div>
  );
};

export default ReceiptTabs;