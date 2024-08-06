package com.owsapp

import android.annotation.SuppressLint
import android.app.Service
import android.content.Context
import android.content.Intent
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
import android.os.Bundle
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import androidx.core.app.ServiceCompat
import com.facebook.react.HeadlessJsTaskService

class AccelerometerService : Service(), SensorEventListener, LocationListener {
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
                val bundle = Bundle()
                bundle.putDouble("timestamp", timeMillis.toDouble())
                bundle.putDouble("x", it.values[0].toDouble())
                bundle.putDouble("y", it.values[1].toDouble())
                bundle.putDouble("z", it.values[2].toDouble())

                sendEvent("AccelerometerData", bundle)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    }

    override fun onLocationChanged(location: Location) {
        val bundle = Bundle()
        bundle.putDouble("timestamp", location.time.toDouble())
        bundle.putDouble("latitude", location.latitude)
        bundle.putDouble("longitude", location.longitude)

        sendEvent("LocationData", bundle)
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

    fun sendEvent(eventName: String, params: Bundle?) {
        val context = applicationContext
        val intent = Intent(context, EventService::class.java)
        intent.putExtra("eventName", eventName)
        intent.putExtra("params", params ?: Bundle())
        context.startService(intent)
        HeadlessJsTaskService.acquireWakeLockNow(context)
    }

    inner class LocalBinder : Binder() {
        fun getService(): AccelerometerService = this@AccelerometerService
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }
}