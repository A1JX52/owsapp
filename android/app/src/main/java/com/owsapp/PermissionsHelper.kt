package com.owsapp

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.net.Uri
import android.os.IBinder
import android.provider.Settings
import android.util.Log
import androidx.core.app.ActivityCompat

class PermissionsHelper : Activity() {
    private val tag = AccelerometerModule::class.java.name

    private lateinit var mService: AccelerometerService
    private var mBound: Boolean = false

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val binder = service as AccelerometerService.LocalBinder
            mService = binder.getService()
            mBound = true
        }

        override fun onServiceDisconnected(arg0: ComponentName) {
            mBound = false
        }
    }

    override fun onStart() {
        super.onStart()

        Intent(this, AccelerometerService::class.java).also { intent ->
            bindService(intent, connection, Context.BIND_AUTO_CREATE)
        }
        ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.ACCESS_FINE_LOCATION),
            AccelerometerService.REQUEST_CODE_LOCATION
        )
    }

    override fun onStop() {
        super.onStop()

        unbindService(connection)
        mBound = false
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        Log.i(tag, "received response from system permissions dialog")
        when (requestCode) {
            AccelerometerService.REQUEST_CODE_LOCATION -> {
                if ((grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED)) {
                    Log.i(tag, "access_fine_location granted")
                    mService.requestLocationUpdates()
                } else if (!ActivityCompat.shouldShowRequestPermissionRationale(this, android.Manifest.permission.ACCESS_FINE_LOCATION)) {
//                    do not ask again (permission denied)
                    mService.sendEvent("LocationPermissionDeniedPermanently", null)

                    val intent = Intent()
                    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                    intent.setData(Uri.fromParts("package", packageName, null))
                    startActivity(intent)
                } else {
//                    explain that feature is unavailable (permission denied)
                    Log.i(tag, "access_fine_location denied")
                }
            }
        }
        finish()
    }
}