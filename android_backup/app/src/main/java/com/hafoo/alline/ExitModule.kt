package com.hafoo.alline

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ExitModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "ExitModule"
    }

    @ReactMethod
    fun exitApp() {
        currentActivity?.finishAndRemoveTask()
    }
}
