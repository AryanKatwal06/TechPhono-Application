import { PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';

type CameraOptionsInput = { includeBase64?: boolean; quality?: number; selectionLimit?: number };

export type ImagePickerAsset = Asset;

export type ImagePickerResult = {
  canceled: boolean;
  assets: Asset[] | null;
};

export class CameraUtils {
  private static cameraRequestCount = 0;

  /**
   * Request camera permissions with proper error handling
   */
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true; // Web handles permissions differently
      }

      if (Platform.OS === 'ios') {
        return true;
      }

      // Prevent multiple simultaneous requests
      if (this.cameraRequestCount > 0) {
        return false;
      }

      this.cameraRequestCount++;
      const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      
      this.cameraRequestCount = 0;

      if (status !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Camera permission request failed:', error);
      this.cameraRequestCount = 0;
      return false;
    }
  }

  /**
   * Request media library permissions with proper error handling
   */
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true;
      }

      if (Platform.OS === 'ios') {
        return true;
      }

      const androidVersion = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
      const permission = androidVersion >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const status = await PermissionsAndroid.request(permission);
      
      if (status !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Media library permission request failed:', error);
      return false;
    }
  }

  /**
   * Launch camera with proper resource management
   */
  static async launchCamera(options?: CameraOptionsInput): Promise<ImagePickerResult> {
    try {
      // Check permissions first
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return {
          canceled: true,
          assets: null
        };
      }

      // Default options for better performance
      const defaultOptions = {
        mediaType: 'photo' as const,
        saveToPhotos: false,
        includeBase64: true,
        quality: 0.8,
        ...options
      };

      const result = await launchCamera(defaultOptions as any);

      return {
        canceled: !!result.didCancel || !!result.errorCode,
        assets: result.assets ?? null,
      };
    } catch (error) {
      console.error('Camera launch failed:', error);
      return {
        canceled: true,
        assets: null
      };
    }
  }

  /**
   * Launch image library with proper error handling
   */
  static async launchImageLibrary(options?: CameraOptionsInput): Promise<ImagePickerResult> {
    try {
      // Check permissions first
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return {
          canceled: true,
          assets: null
        };
      }

      // Default options
      const defaultOptions = {
        mediaType: 'photo' as const,
        selectionLimit: 1,
        includeBase64: true,
        quality: 0.8,
        ...options
      };

      const result = await launchImageLibrary(defaultOptions as any);

      return {
        canceled: !!result.didCancel || !!result.errorCode,
        assets: result.assets ?? null,
      };
    } catch (error) {
      console.error('Image library launch failed:', error);
      return {
        canceled: true,
        assets: null
      };
    }
  }

  /**
   * Clean up camera resources
   */
  static cleanup(): void {
    this.cameraRequestCount = 0;
  }

  /**
   * Check if camera is available
   */
  static async isCameraAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      }

      return true;
    } catch (error) {
      console.error('Camera availability check failed:', error);
      return false;
    }
  }
}
