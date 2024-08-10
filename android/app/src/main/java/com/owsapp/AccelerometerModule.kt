package com.owsapp

import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import androidx.activity.result.ActivityResultCallback
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

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

    @ReactMethod
    fun handleLocationPermissions(promise: Promise) {
        Log.i(tag, "test if access_fine_location granted")

        if (!reactContext.hasCurrentActivity()) {
            Log.w(tag, "currently only headless js available")
            promise.reject("E_LIFECYCLE", "cannot reach MainActivity")
            return
        }
        val activity = reactContext.currentActivity as MainActivity
        activity.mActivityResultCallback = ActivityResultCallback { result ->
            result?.data?.extras?.getString("result")?.let {
                promise.resolve(it);
                return@ActivityResultCallback
            }
            promise.reject("E_INVALID_ARGUMENT", "PermissionsHelper returned invalid result")
        }

        when {
            ContextCompat.checkSelfPermission(reactContext, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED -> {
                Log.i(tag, "access_fine_location already granted")
                promise.resolve(PermissionsHelper.GRANTED)
            }
            ActivityCompat.shouldShowRequestPermissionRationale(activity!!, android.Manifest.permission.ACCESS_FINE_LOCATION) -> {
//                explain why permission is required for feature

                UiThreadUtil.runOnUiThread {
                    AlertDialog.Builder(activity)
                        .setTitle("Location Permission Needed")
                        .setMessage("This app requires access to your location to provide location-based services.")
                        .setPositiveButton("OK") { _, _ ->
                            val intent = Intent(activity, PermissionsHelper::class.java)
                            activity.mStartForResult.launch(intent)
                        }
                        .setNegativeButton("Cancel", null)
                        .create()
                        .show()
                }
            }
            else -> {
                val intent = Intent(activity, PermissionsHelper::class.java)
                activity.mStartForResult.launch(intent)
            }
        }
    }
}