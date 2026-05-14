import 'react-native-gesture-handler';
import 'react-native-get-random-values';

// Polyfill TextEncoder and TextDecoder for Hermes
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      const utf8 = unescape(encodeURIComponent(str));
      const arr = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) {
        arr[i] = utf8.charCodeAt(i);
      }
      return arr;
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(arr) {
      const uint8 = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
      let str = '';
      for (let i = 0; i < uint8.length; i += 10000) {
        str += String.fromCharCode.apply(null, Array.from(uint8.subarray(i, i + 10000)));
      }
      try {
        return decodeURIComponent(escape(str));
      } catch (e) {
        return str;
      }
    }
  };
}

import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const appName = 'TechPhono';

// Install a global JS error handler to capture uncaught exceptions
try {
	// Preserve existing global handler if present
	// @ts-ignore: ErrorUtils is global in React Native
	const defaultHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();
	// @ts-ignore
	ErrorUtils.setGlobalHandler((error, isFatal) => {
		console.error('Global JS exception:', error, isFatal);
		if (defaultHandler) defaultHandler(error, isFatal);
	});
} catch (e) {
	// ignore if ErrorUtils not available
}

// Register a wrapper component that uses ErrorBoundary to avoid hard crashes
AppRegistry.registerComponent(appName, () => () => (
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
));
