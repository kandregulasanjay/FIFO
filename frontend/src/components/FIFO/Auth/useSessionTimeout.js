import { useEffect, useRef } from 'react';
import { showSessionTimeoutPopup } from './SessionTimeoutPopup';

const INACTIVITY_LIMIT = 10 * 60 * 1000;
const WARNING_TIME = 30 * 1000; 

export default function useSessionTimeout(isLoggedIn) {
    const timer = useRef();
    const warningTimer = useRef();

    useEffect(() => {
         if (!isLoggedIn) return; 
        const resetTimer = () => {
            clearTimeout(timer.current);
            clearTimeout(warningTimer.current);

            timer.current = setTimeout(() => {
                showSessionTimeoutPopup("You will be logged out in 30 seconds due to inactivity.",
                    () => {
                        resetTimer();
                    }
                );

                warningTimer.current = setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    window.location.href = '/auth';
                }, WARNING_TIME);
            }, INACTIVITY_LIMIT - WARNING_TIME);
        };

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'focus'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimer));
            clearTimeout(timer.current);
            clearTimeout(warningTimer.current);
        };
    }, [isLoggedIn]);
}