package com.owsapp

import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.SystemClock
import android.text.format.DateFormat.getDateFormat
import android.util.Log
import androidx.core.app.ServiceCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Date

class AccelerometerService : HeadlessJsTaskService(), SensorEventListener {
    private val tag = AccelerometerService::class.java.name

    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null

    companion object {
        var IS_RUNNING = false
        const val NOTIFICATION_ID = 1
    }

    override fun onCreate() {
        super.onCreate();
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(tag, "received start foreground intent")
        startAsForegroundService()
        accelerometer?.also { accel ->
            sensorManager.registerListener(this, accel, SensorManager.SENSOR_DELAY_NORMAL)
        }
        IS_RUNNING = true
        return START_NOT_STICKY
    }

    override fun onDestroy() {
//        is onTaskRemoved a better choice for cleanup?
        Log.i(tag, "received stop foreground intent")
        sensorManager.unregisterListener(this)
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

    private fun sendEvent(eventName: String, params: WritableMap?) {
        var reactContext = reactNativeHost.reactInstanceManager.currentReactContext

        reactContext?.let {
            it
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
            return;
        }
        Log.w(tag, "react context could not be determined")
    }
}