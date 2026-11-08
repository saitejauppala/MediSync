import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Search location manually.');
        } else {
          setError('Unable to acquire current location coordinates.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return { coordinates, error, loading, getCurrentLocation };
};

export default useGeolocation;
