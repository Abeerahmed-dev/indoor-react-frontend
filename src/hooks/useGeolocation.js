import { useState, useEffect } from 'react';

const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        const handleSuccess = (position) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });
            setLoading(false);
        };

        const handleError = (error) => {
            let errorMsg = 'An unknown error occurred';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'User denied the request for Geolocation';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Location information is unavailable';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'The request to get user location timed out';
                    break;
            }
            setError(errorMsg);
            setLoading(false);
        };

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });
    }, []);

    return { location, error, loading };
};

export default useGeolocation;
