import React, { useState } from 'react';
import { Modal, Button } from '@mui/material';

let showPopupCallback = null;
let continueCallback = null; // Add this line

export const showSessionTimeoutPopup = (message = "Your session has expired. Please log in again.", onContinue) => {
    if (showPopupCallback) {
        showPopupCallback({ open: true, message });
        continueCallback = onContinue; // Save the callback
    }
};

const SessionTimeoutPopup = () => {
    const [popupState, setPopupState] = useState({ open: false, message: "" });

    showPopupCallback = setPopupState;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/auth'; 
    };

    const handleContinue = () => {
        setPopupState({ ...popupState, open: false });
        if (continueCallback) {
            continueCallback(); // Call the reset timer function
        }
    };

    return (
        <Modal open={popupState.open} onClose={() => setPopupState({ ...popupState, open: false })}>
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                    textAlign: 'center',
                    width: '90%',
                    maxWidth: '400px',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                    Session Timeout
                </h2>
                <p style={{ fontSize: '1rem', color: '#555', marginBottom: '20px' }}>
                    {popupState.message}
                </p>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleContinue}
                    style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        padding: '10px 20px',
                        fontSize: '1rem',
                        borderRadius: '8px',
                        textTransform: 'none',
                        boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                        marginRight: '10px'
                    }}
                >
                    Continue
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleLogout}
                    style={{
                        backgroundColor: '#dc004e',
                        color: 'white',
                        padding: '10px 20px',
                        fontSize: '1rem',
                        borderRadius: '8px',
                        textTransform: 'none',
                        boxShadow: '0 4px 10px rgba(220, 0, 78, 0.3)',
                    }}
                >
                    Logout
                </Button>
            </div>
        </Modal>
    );
};

export default SessionTimeoutPopup;
