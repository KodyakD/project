import { Alert } from 'react-native';

export const safeNavigate = (router: any, path: string, params?: any) => {
  if (!router) {
    console.warn('Router not available for navigation to:', path);
    return false;
  }
  
  try {
    // Add more debugging
    console.log(`Navigating to: ${path}`, params);
    
    // Increase the timeout to ensure the router is fully ready
    setTimeout(() => {
      if (params) {
        router.push({
          pathname: path,
          params
        });
      } else {
        router.push(path);
      }
    }, 100); // Increased from 0 to 100ms
    return true;
  } catch (error) {
    console.error('Navigation error:', error);
    Alert.alert(
      'Navigation Error',
      'Unable to view incident details. Please try again.'
    );
    return false;
  }
};

export const safeGoBack = (router: any) => {
  try {
    if (!router) {
      console.warn('Router not available for back navigation');
      return false;
    }
    
    setTimeout(() => {
      router.back();
    }, 0);
    return true;
  } catch (error) {
    console.error('Back navigation error:', error);
    // Fall back to navigating to a known route if back fails
    safeNavigate(router, '/');
    return false;
  }
};