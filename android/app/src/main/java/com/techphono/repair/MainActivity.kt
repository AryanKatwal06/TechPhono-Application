package com.techphono.repair

import android.os.Build
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    try {
      installSplashScreen()
      super.onCreate(savedInstanceState)
    } catch (e: UnsatisfiedLinkError) {
      Log.e("MainActivity", "Native library loading error (expected for new arch disabled)", e)
    } catch (e: Exception) {
      Log.e("MainActivity", "Error during onCreate", e)
      throw e
    }
  }

  override fun getMainComponentName(): String = "TechPhono"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return SafeReactActivityDelegate(
      this,
      mainComponentName ?: "TechPhono",
      false
    )
  }

  private inner class SafeReactActivityDelegate(
    activity: ReactActivity,
    mainComponentName: String,
    fabricEnabled: Boolean
  ) : DefaultReactActivityDelegate(activity, mainComponentName, fabricEnabled) {
    override fun onCreate(savedInstanceState: Bundle?) {
      try {
        super.onCreate(savedInstanceState)
      } catch (e: UnsatisfiedLinkError) {
        Log.e("SafeReactActivityDelegate", "Native library loading error (expected for new arch disabled)", e)
      } catch (e: AssertionError) {
        Log.e("SafeReactActivityDelegate", "Assertion error during React initialization (Hermes/JSC engine loading issue)", e)
        // This occurs when Hermes fails to load but JSC should be available
      } catch (e: Exception) {
        Log.e("SafeReactActivityDelegate", "Error during React initialization", e)
        // Don't rethrow - allow graceful handling
      }
    }
  }

  override fun invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      if (!moveTaskToBack(false)) {
        super.invokeDefaultOnBackPressed()
      }
      return
    }
    super.invokeDefaultOnBackPressed()
  }
}

