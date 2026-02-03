import { useEffect, useState } from 'react';
import {
  requestLocationPermission,
  hasLocationPermission,
  getCurrentLocation,
  watchLocation,
  LocationData,
} from '@/services/location.service';
import { useLocationStore } from '@/store/location.store';

export function useLocation() {
  const {
    currentLocation,
    hasPermission,
    setLocation,
    setPermission,
    error,
    clearError,
  } = useLocationStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await hasLocationPermission();
    setPermission(granted);
  };

  const requestPermission = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const granted = await requestLocationPermission();
      setPermission(granted);
      return granted;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocation = async (): Promise<LocationData | null> => {
    setIsLoading(true);
    clearError();
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      const location = await getCurrentLocation();
      setLocation(location);
      return location;
    } catch (error: any) {
      useLocationStore.setState({ error: error.message });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const startWatching = async (
    onUpdate?: (location: LocationData) => void
  ) => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    return await watchLocation(
      (location) => {
        setLocation(location);
        onUpdate?.(location);
      },
      (error) => {
        useLocationStore.setState({ error: error.message });
      }
    );
  };

  return {
    currentLocation,
    hasPermission,
    isLoading,
    error,
    requestPermission,
    fetchLocation,
    startWatching,
    clearError,
  };
}
