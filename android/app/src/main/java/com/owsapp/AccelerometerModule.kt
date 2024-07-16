package com.owsapp

import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AccelerometerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val tag = AccelerometerModule::class.java.name

    override fun getName() = "AccelerometerModule"

    @ReactMethod
    fun startService() {
        if (AccelerometerService.IS_RUNNING) return
        Log.i(tag, "starting background service")
        val intent = Intent(reactContext, AccelerometerService::class.java)
        ContextCompat.startForegroundService(reactContext, intent)
    }

    @ReactMethod
    fun stopService() {
        if (!AccelerometerService.IS_RUNNING) return
        Log.i(tag, "stopping background service");
        val intent = Intent(reactContext, AccelerometerService::class.java)
        reactContext.stopService(intent)
    }

    @ReactMethod
    fun addListener(eventName: String) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }
}