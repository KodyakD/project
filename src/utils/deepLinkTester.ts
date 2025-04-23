import * as Linking from 'expo-linking';

/**
 * Utility for testing deep links during development
 */
class DeepLinkTester {
  /**
   * Test opening a deep link with the app's scheme
   */
  static async testDeepLink(path: string): Promise<void> {
    try {
      // Format the URL with the app scheme
      const url = `firerescueexpert://${path.startsWith('/') ? path.substring(1) : path}`;
      console.log(`Testing deep link: ${url}`);
      
      // Attempt to open the URL
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error testing deep link:', error);
    }
  }

  /**
   * Test a universal link (https URL)
   */
  static async testUniversalLink(path: string): Promise<void> {
    try {
      // Format the URL with the domain
      const url = `https://firerescue.example.com/${path.startsWith('/') ? path.substring(1) : path}`;
      console.log(`Testing universal link: ${url}`);
      
      // Attempt to open the URL
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error testing universal link:', error);
    }
  }

  /**
   * Test a notification deep link by simulating a notification
   */
  static async testNotificationDeepLink(
    type: string, 
    id: string, 
    extraData: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Generate path based on notification type
      let path = '';
      
      switch (type) {
        case 'emergency':
          path = `/emergency/${id}`;
          break;
        case 'incident':
          path = `/incidents/${id}`;
          break;
        case 'maintenance':
          path = `/maintenance/${id}`;
          break;
        case 'announcement':
          path = `/announcements/${id}`;
          break;
        default:
          path = `/notifications`;
      }
      
      // Test the deep link
      await this.testDeepLink(path);
      
      console.log('Notification deep link test data:', {
        type,
        id,
        path,
        ...extraData
      });
    } catch (error) {
      console.error('Error testing notification deep link:', error);
    }
  }

  /**
   * Generate a QR code URL for testing deep links
   */
  static getQRCodeURL(path: string): string {
    // Format the app URL
    const appUrl = `firerescueexpert://${path.startsWith('/') ? path.substring(1) : path}`;
    
    // Create a QR code URL using a public QR code generator service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;
  }

  /**
   * Get a list of example deep links for testing
   */
  static getExampleDeepLinks(): Array<{ name: string; path: string }> {
    return [
      { name: 'Home', path: '/home' },
      { name: 'Notifications', path: '/notifications' },
      { name: 'Incident 123', path: '/incidents/123' },
      { name: 'Emergency Alert', path: '/emergency/alert-456' },
      { name: 'Maintenance Issue', path: '/maintenance/789' },
      { name: 'Settings', path: '/settings' },
      { name: 'Notification Settings', path: '/settings/notifications' },
    ];
  }
}

export default DeepLinkTester; 