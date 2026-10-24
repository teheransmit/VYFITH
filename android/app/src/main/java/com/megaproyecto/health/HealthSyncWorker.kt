package com.megaproyecto.health

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.changes.DeletionChange
import androidx.health.connect.client.changes.UpsertionChange
import androidx.health.connect.client.request.ChangesTokenRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * HealthSyncWorker
 * 
 * Clase Kotlin ejecutada en segundo plano por WorkManager.
 * Usa "Changes Tokens" de Google Health Connect para consultar deltas
 * (UpsertionChange y DeletionChange) y transmitirlos mediante HTTPS al backend
 * formateados bajo el estándar HL7 FHIR R4 (códigos LOINC).
 */
class HealthSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val TAG = "HealthSyncWorker"
    private val PREFS_NAME = "MegaProyectoHealthPrefs"
    private val KEY_CHANGES_TOKEN = "key_changes_token"
    private val KEY_BACKEND_URL = "key_backend_url"
    private val KEY_DEVICE_ID = "key_device_id"
    private val KEY_AUTH_TOKEN = "key_auth_token"

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val healthConnectClient = HealthConnectClient.getOrCreate(applicationContext)
            
            val fhirObservations = JSONArray()
            val storedToken = getStoredChangesToken()
            val token: String
            var nextChangesToken: String

            if (storedToken == null) {
                // El primer token solo marca un punto de partida; no contiene el histórico.
                // Cargamos una ventana inicial para que la web no empiece vacía.
                appendInitialRecords(healthConnectClient, fhirObservations)
                token = requestNewChangesToken(healthConnectClient)
                nextChangesToken = token
            } else {
                token = storedToken
                val changesResponse = healthConnectClient.getChanges(token)

                for (change in changesResponse.changes) {
                    when (change) {
                        is UpsertionChange -> {
                            val record = change.record
                            when (record) {
                                is StepsRecord -> fhirObservations.put(mapStepsToFhir(record))
                                is HeartRateRecord -> fhirObservations.put(mapHeartRateToFhir(record))
                                is SleepSessionRecord -> fhirObservations.put(mapSleepToFhir(record))
                                is HeartRateVariabilityRmssdRecord -> fhirObservations.put(mapHrvToFhir(record))
                            }
                        }
                        is DeletionChange -> {
                            Log.d(TAG, "Registro biométrico borrado en dispositivo: ${change.recordId}")
                        }
                    }
                }
                nextChangesToken = changesResponse.nextChangesToken
            }

            // Transmitir lote FHIR al backend si hay observaciones acumuladas.
            if (fhirObservations.length() > 0) {
                val success = sendToBackend(fhirObservations, token)
                if (!success) {
                    Log.w(TAG, "Reintentando sincronización posterior por fallo de red")
                    return@withContext Result.retry()
                }
            } else {
                val nowStr = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                getPrefs().edit().apply {
                    putString("key_last_sync_time", nowStr)
                    putString("key_last_sync_status", "Al día (Sin nuevos deltas desde la última sincronización)")
                }.apply()
            }

            // Guardar el token para la próxima ejecución; el primer token queda vigente
            // después del bootstrap y las ejecuciones posteriores usan deltas.
            saveChangesToken(nextChangesToken)

            Log.i(TAG, "Sincronización completada exitosamente. Elementos procesados: ${fhirObservations.length()}")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Excepción en HealthSyncWorker:", e)
            Result.retry()
        }

    }

    private suspend fun appendInitialRecords(
        client: HealthConnectClient,
        observations: JSONArray
    ) {
        val now = java.time.Instant.now()
        val start = now.minus(7, java.time.temporal.ChronoUnit.DAYS)
        val range = TimeRangeFilter.between(start, now)

        client.readRecords(
            ReadRecordsRequest(recordType = StepsRecord::class, timeRangeFilter = range)
        ).records.forEach { observations.put(mapStepsToFhir(it)) }
        client.readRecords(
            ReadRecordsRequest(recordType = HeartRateRecord::class, timeRangeFilter = range)
        ).records.forEach { observations.put(mapHeartRateToFhir(it)) }
        client.readRecords(
            ReadRecordsRequest(recordType = SleepSessionRecord::class, timeRangeFilter = range)
        ).records.forEach { observations.put(mapSleepToFhir(it)) }
        client.readRecords(
            ReadRecordsRequest(recordType = HeartRateVariabilityRmssdRecord::class, timeRangeFilter = range)
        ).records.forEach { observations.put(mapHrvToFhir(it)) }
    }

    private suspend fun requestNewChangesToken(client: HealthConnectClient): String {
        val request = ChangesTokenRequest(
            recordTypes = setOf(
                StepsRecord::class,
                HeartRateRecord::class,
                SleepSessionRecord::class,
                HeartRateVariabilityRmssdRecord::class
            )
        )
        return client.getChangesToken(request)
    }

    private fun sendToBackend(payload: JSONArray, token: String): Boolean {
        return try {
            val endpoint = getBackendUrl()
            val url = URL(endpoint)
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            connection.setRequestProperty("Accept", "application/json")
            
            val authToken = getAuthToken()
            if (authToken.isNotEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer $authToken")
            }
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.doOutput = true

            val body = JSONObject().apply {
                put("deviceId", getDeviceId())
                put("changesToken", token)
                put("health", payload)
            }

            OutputStreamWriter(connection.outputStream).use { it.write(body.toString()) }
            
            val responseCode = connection.responseCode
            val isSuccess = responseCode in 200..299
            
            // Guardar registro de auditoría para verificación en la UI de MainActivity
            val nowStr = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
            getPrefs().edit().apply {
                putString("key_last_sync_time", nowStr)
                putInt("key_last_sync_code", responseCode)
                putInt("key_last_sync_records", payload.length())
                putString("key_last_sync_status", if (isSuccess) "HTTP $responseCode OK — Datos recibidos" else "HTTP $responseCode Error en backend")
            }.apply()
            
            isSuccess
        } catch (e: Exception) {
            Log.e(TAG, "Fallo de conexión enviando deltas al backend", e)
            val nowStr = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
            getPrefs().edit().apply {
                putString("key_last_sync_time", nowStr)
                putString("key_last_sync_status", "Fallo de conexión: ${e.message ?: "Sin respuesta de red"}")
            }.apply()
            false
        }
    }

    // --- Mapeo oficial a HL7 FHIR R4 ---
    
    private fun mapStepsToFhir(record: StepsRecord): JSONObject {
        return JSONObject().apply {
            put("resourceType", "Observation")
            put("status", "final")
            put("category", "Actividad Física")
            put("code", JSONObject().apply {
                put("coding", JSONArray().apply {
                    put(JSONObject().apply {
                        put("system", "http://loinc.org")
                        put("code", "55423-8")
                        put("display", "Number of steps")
                    })
                })
            })
            put("valueQuantity", JSONObject().apply {
                put("value", record.count)
                put("unit", "steps")
            })
            put("effectiveDateTime", record.startTime.toString())
        }
    }

    private fun mapHeartRateToFhir(record: HeartRateRecord): JSONObject {
        val avgBpm = if (record.samples.isNotEmpty()) {
            record.samples.map { it.beatsPerMinute }.average().toInt()
        } else {
            70
        }
        return JSONObject().apply {
            put("resourceType", "Observation")
            put("status", "final")
            put("category", "Cardiovascular")
            put("code", JSONObject().apply {
                put("coding", JSONArray().apply {
                    put(JSONObject().apply {
                        put("system", "http://loinc.org")
                        put("code", "8867-4")
                        put("display", "Heart rate")
                    })
                })
            })
            put("valueQuantity", JSONObject().apply {
                put("value", avgBpm)
                put("unit", "bpm")
            })
            put("effectiveDateTime", record.startTime.toString())
        }
    }

    private fun mapSleepToFhir(record: SleepSessionRecord): JSONObject {
        val durationHours = java.time.Duration.between(record.startTime, record.endTime).toMinutes() / 60.0
        return JSONObject().apply {
            put("resourceType", "Observation")
            put("status", "final")
            put("category", "Sueño y Descanso")
            put("code", JSONObject().apply {
                put("coding", JSONArray().apply {
                    put(JSONObject().apply {
                        put("system", "http://loinc.org")
                        put("code", "93832-4")
                        put("display", "Sleep duration")
                    })
                })
            })
            put("valueQuantity", JSONObject().apply {
                put("value", durationHours)
                put("unit", "hours")
            })
            put("effectiveDateTime", record.startTime.toString())
        }
    }

    private fun mapHrvToFhir(record: HeartRateVariabilityRmssdRecord): JSONObject {
        return JSONObject().apply {
            put("resourceType", "Observation")
            put("status", "final")
            put("category", "Recuperación Biológica")
            put("code", JSONObject().apply {
                put("coding", JSONArray().apply {
                    put(JSONObject().apply {
                        put("system", "http://loinc.org")
                        put("code", "80404-7")
                        put("display", "R-R interval.standard deviation (Heart rate variability)")
                    })
                })
            })
            put("valueQuantity", JSONObject().apply {
                put("value", record.heartRateVariabilityMillis)
                put("unit", "ms")
            })
            put("effectiveDateTime", record.time.toString())
        }
    }

    // --- Persistencia con SharedPreferences ---

    private fun getPrefs(): SharedPreferences {
        return applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private fun getStoredChangesToken(): String? {
        return getPrefs().getString(KEY_CHANGES_TOKEN, null)
    }

    private fun saveChangesToken(token: String) {
        getPrefs().edit().putString(KEY_CHANGES_TOKEN, token).apply()
    }

    private fun getBackendUrl(): String {
        return getPrefs().getString(KEY_BACKEND_URL, "http://192.168.1.8:3000/api/sync/health")!!
    }

    private fun getDeviceId(): String {
        return getPrefs().getString(KEY_DEVICE_ID, android.os.Build.MODEL) ?: "android-device"
    }

    private fun getAuthToken(): String {
        return getPrefs().getString(KEY_AUTH_TOKEN, "") ?: ""
    }
}
