import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export class CameraUtils {
  private static isCameraInitialized = false;
  private static cameraRequestCount = 0;

  /**
   * Request camera permissions with proper error handling
   */
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true; // Web handles permissions differently
      }

      // Prevent multiple simultaneous requests
      if (this.cameraRequestCount > 0) {
        console.warn('⚠️ Camera permission request already in progress');
        return false;
      }

      this.cameraRequestCount++;

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      this.cameraRequestCount = 0;

      if (status !== 'granted') {
        console.warn('⚠️ Camera permission denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Camera permission request failed:', error);
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

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('⚠️ Media library permission denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Media library permission request failed:', error);
      return false;
    }
  }

  /**
   * Launch camera with proper resource management
   */
  static async launchCamera(options?: ImagePicker.ImagePickerOptions): Promise<ImagePicker.ImagePickerResult> {
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
      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        ...options
      };

      const result = await ImagePicker.launchCameraAsync(defaultOptions);
      
      // Log camera usage for debugging
      if (!result.canceled) {
        console.log('📸 Camera captured image successfully');
      }

      return result;
    } catch (error) {
      console.error('❌ Camera launch failed:', error);
      return {
        canceled: true,
        assets: null
      };
    }
  }

  /**
   * Launch image library with proper error handling
   */
  static async launchImageLibrary(options?: ImagePicker.ImagePickerOptions): Promise<ImagePicker.ImagePickerResult> {
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
      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        ...options
      };

      const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);
      
      if (!result.canceled) {
        console.log('🖼️ Image selected from library successfully');
      }

      return result;
    } catch (error) {
      console.error('❌ Image library launch failed:', error);
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
    try {
      this.isCameraInitialized = false;
      this.cameraRequestCount = 0;
      console.log('🧹 Camera resources cleaned up');
    } catch (error) {
      console.warn('⚠️ Camera cleanup warning:', error);
    }
  }

  /**
   * Check if camera is available
   */
  static async isCameraAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      }

      const status = await ImagePicker.getCameraPermissionsAsync();
      return status.status === 'granted';
    } catch (error) {
      console.error('❌ Camera availability check failed:', error);
      return false;
    }
  }
}
