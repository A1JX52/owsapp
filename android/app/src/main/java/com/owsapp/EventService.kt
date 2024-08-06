package com.owsapp

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class EventService : HeadlessJsTaskService() {
    private val tag = EventService::class.java.name

    override fun getTaskConfig(intent: Intent): HeadlessJsTaskConfig? {
        val taskKey = intent.getStringExtra("eventName")
        return HeadlessJsTaskConfig(
            taskKey,
            Arguments.fromBundle(intent.getBundleExtra("params")),
            5000,
            true
        )
    }
}