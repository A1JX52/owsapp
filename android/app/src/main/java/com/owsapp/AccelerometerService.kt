package com.owsapp

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class AccelerometerService : HeadlessJsTaskService(), SensorEventListener, LocationListener {
    private val tag = AccelerometerService::class.java.name

    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    private lateinit var locationManager: LocationManager

    private val binder = LocalBinder()

    companion object {
        var IS_RUNNING = false
        const val NOTIFICATION_ID = 1
        const val REQUEST_CODE_LOCATION = 1
    }

    override fun onCreate() {
        super.onCreate();
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        accelerometer ?: Log.e(tag, "there is no accelerometer sensor")

        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        Log.i(tag, "test if access_fine_location granted")

        val reactContext = reactNativeHost.reactInstanceManager.currentReactContext
        val activity = reactContext?.currentActivity

        when {
            ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED -> {
                Log.i(tag, "access_fine_location already granted")
                requestLocationUpdates()
                return
            }
            ActivityCompat.shouldShowRequestPermissionRationale(activity!!, android.Manifest.permission.ACCESS_FINE_LOCATION) -> {
//                explain why permission is required for feature

                AlertDialog.Builder(activity)
                    .setTitle("Location Permission Needed")
                    .setMessage("This app requires access to your location to provide location-based services.")
                    .setPositiveButton("OK") { _, _ ->
                        val intent = Intent(activity, PermissionsHelper::class.java)
                        activity.startActivity(intent)
                    }
                    .setNegativeButton("Cancel", null)
                    .create()
                    .show()
            }
            else -> {
                val intent = Intent(activity, PermissionsHelper::class.java)
                activity.startActivity(intent)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(tag, "received start foreground intent")
        startAsForegroundService()
        accelerometer?.also { accel ->
            sensorManager.registerListener(this, accel, SensorManager.SENSOR_DELAY_NORMAL)
        }
        IS_RUNNING = true
        return START_STICKY
    }

    override fun onDestroy() {
//        is onTaskRemoved a better choice for cleanup?
        Log.i(tag, "received stop foreground intent")
        sensorManager.unregisterListener(this)
        locationManager.removeUpdates(this)
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_DETACH)
        stopSelf()
        IS_RUNNING = false

        super.onDestroy()
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            val timeMillis = System.currentTimeMillis() + (event.timestamp - SystemClock.elapsedRealtimeNanos()) / 1000000L

            if (it.sensor.type == Sensor.TYPE_ACCELEROMETER) {
                val map: WritableMap = Arguments.createMap()
                map.putDouble("timestamp", timeMillis.toDouble())
                map.putDouble("x", it.values[0].toDouble())
                map.putDouble("y", it.values[1].toDouble())
                map.putDouble("z", it.values[2].toDouble())

                sendEvent("AccelerometerData", map)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    }

    override fun onLocationChanged(location: Location) {
        val map: WritableMap = Arguments.createMap()
        map.putDouble("timestamp", location.time.toDouble())
        map.putDouble("latitude", location.latitude)
        map.putDouble("longitude", location.longitude)

        sendEvent("LocationData", map)
    }

    //permission check handled by caller
    @SuppressLint("MissingPermission")
    fun requestLocationUpdates() {
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0f, this)
    }

    private fun startAsForegroundService() {
        NotificationsHelper.createNotificationChannel(this)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                NotificationsHelper.buildNotification(this),
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
                } else {
                    0
                }
            )
        }
    }

    fun sendEvent(eventName: String, params: WritableMap?) {
        var reactContext = reactNativeHost.reactInstanceManager.currentReactContext

        reactContext?.let {
            it
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
            return;
        }
        Log.w(tag, "react context could not be determined")
    }

    inner class LocalBinder : Binder() {
        fun getService(): AccelerometerService = this@AccelerometerService
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }
}