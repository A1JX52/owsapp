package com.owsapp

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import android.util.Log
import androidx.core.app.ActivityCompat

class PermissionsHelper : Activity() {
    private val tag = PermissionsHelper::class.java.name

    companion object {
        const val GRANTED = "PERMISSION_GRANTED"
        const val DENIED = "PERMISSION_DENIED"
        const val DENIED_PERMANENTLY = "PERMISSION_DENIED_PERMANENTLY"

        const val REQUEST_CODE_LOCATION = 1
    }

    override fun onStart() {
        super.onStart()

        ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.ACCESS_FINE_LOCATION),
            REQUEST_CODE_LOCATION
        )
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        Log.i(tag, "received response from system permissions dialog")
        val resultIntent = Intent()

        when (requestCode) {
            REQUEST_CODE_LOCATION -> {
                if ((grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED)) {
                    Log.i(tag, "access_fine_location granted")
                    resultIntent.putExtra("result", GRANTED)
                    setResult(RESULT_OK, resultIntent)
                } else if (!ActivityCompat.shouldShowRequestPermissionRationale(this, android.Manifest.permission.ACCESS_FINE_LOCATION)) {
//                    do not ask again (permission denied)
                    Log.i(tag, "access_fine_location denied permanently")
                    resultIntent.putExtra("result", DENIED_PERMANENTLY)
                    setResult(RESULT_OK, resultIntent)

                    val intent = Intent()
                    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                    intent.setData(Uri.fromParts("package", packageName, null))
                    startActivity(intent)
                } else {
//                    explain that feature is unavailable (permission denied)
                    Log.i(tag, "access_fine_location denied")
                    resultIntent.putExtra("result", DENIED)
                    setResult(RESULT_CANCELED, resultIntent)
                }
            }
        }
        finish()
    }
}