package com.megaproyecto.health.finance.util

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class DailyReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (NotificationHelper.isNotificationEnabled(context)) {
            NotificationHelper.showReminderNotification(context)

            // Reschedule for next day
            val (hour, minute) = NotificationHelper.getReminderTime(context)
            NotificationHelper.scheduleDailyReminder(context, hour, minute)
        }
    }
}
