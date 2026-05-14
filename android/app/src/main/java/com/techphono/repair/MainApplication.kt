package com.techphono.repair

import android.app.Application

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import android.util.Log

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
    override fun getPackages(): List<ReactPackage> =
      PackageList(this).packages.apply {
        // Packages that cannot be autolinked yet can be added manually here.
      }

    override fun getJSMainModuleName(): String = "index"

    override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

    override val isNewArchEnabled: Boolean = false
  }

  override fun onCreate() {
    overrideReactNativeFeatureFlagsAccessor()
    super.onCreate()
    // Initialize SoLoader early. Required for React Native native libraries
    // and feature flag C++ interop (prevents "SoLoader.init() not yet called").
    try {
      SoLoader.init(this, OpenSourceMergedSoMapping)
    } catch (e: Exception) {
      // Gracefully handle missing native libraries when New Architecture is disabled
      android.util.Log.e("SoLoader", "Error initializing SoLoader", e)
    }
  }

  private fun overrideReactNativeFeatureFlagsAccessor() {
    try {
      val flagsClass = Class.forName("com.facebook.react.internal.featureflags.ReactNativeFeatureFlags")
      val instanceField = flagsClass.getDeclaredField("INSTANCE")
      val instance = instanceField.get(null)
      val accessorField = flagsClass.getDeclaredField("accessor")
      accessorField.isAccessible = true

      val localAccessorClass = Class.forName(
        "com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsLocalAccessor"
      )
      val localAccessor = localAccessorClass.getDeclaredConstructor().newInstance()
      accessorField.set(instance, localAccessor)
    } catch (e: Exception) {
      Log.w("MainApplication", "Unable to force React Native local feature flags", e)
    }
  }
}
