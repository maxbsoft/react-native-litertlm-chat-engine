package com.rnlitertlmchatengine

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = RnLitertlmChatEngineModule.NAME)
class RnLitertlmChatEngineModule(reactContext: ReactApplicationContext) :
  NativeRnLitertlmChatEngineSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  // Test function
  override fun testCFunction(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  // Engine lifecycle
  override fun createEngine(config: ReadableMap, promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  override fun destroyEngine(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  override fun isReady(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  // Generation
  override fun generateAsync(inputText: String, promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  override fun stopGeneration(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  override fun isGenerating(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  // History management
  override fun clearHistory(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  // Model information
  override fun getModelInfo(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  // Debug functions
  override fun getDebugMessage(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  override fun getDebugHistory(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  override fun logFromSwift(message: String, promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  override fun clearDebugHistory(promise: Promise) {
    promise.reject("ANDROID_NOT_SUPPORTED", "Android support is not yet implemented")
  }

  companion object {
    const val NAME = "RnLitertlmChatEngine"
  }
}
