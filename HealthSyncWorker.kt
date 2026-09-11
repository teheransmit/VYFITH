package com.megaproyecto.health

import android.content.Context
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.changes.DeletionChange
import androidx.health.connect.client.changes.UpsertionChange
import androidx.health.connect.client.request.ChangesTokenRequest
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
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
 * Clase Kotlin para ser ejecutada en segundo plano vía WorkManager.
 * Se encarga de usar "Changes Tokens" de Health Connect para obtener únicamente
 * los deltas (registros nuevos o eliminados) y mapearlos al estándar FHIR R4.
 */
class HealthSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val TAG = "HealthSyncWorker"

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val healthConnectClient = HealthConnectClient.getOrCreate(applicationContext)
            
            // 1. Recuperar el token de cambios guardado o solicitar uno nuevo
            val token = getStoredChangesToken() ?: requestNewChangesToken(healthConnectClient)
            
            // 2. Obtener los cambios (deltas)
            val changesResponse = healthConnectClient.getChanges(token)
            val fhirObservations = JSONArray()

            for (change in changesResponse.changes) {
                when (change) {
                    is UpsertionChange -> {
                        val record = change.record
                        // Mapeo a HL7 FHIR R4 Observation
                        when (record) {
                            is StepsRecord -> fhirObservations.put(mapStepsToFhir(record))
                            is HeartRateRecord -> fhirObservations.put(mapHeartRateToFhir(record))
                            is SleepSessionRecord -> fhirObservations.put(mapSleepToFhir(record))
                            is HeartRateVariabilityRmssdRecord -> fhirObservations.put(mapHrvToFhir(record))
                        }
                    }
                    is DeletionChange -> {
                        Log.d(TAG, "Registro eliminado en origen: ${change.recordId}")
                        // Lógica opcional para enviar borrados al backend
                    }
                }
            }

            // 3. Enviar lote al backend si hay datos
            if (fhirObservations.length() > 0) {
                val success = sendToBackend(fhirObservations)
                if (!success) {
                    // Reintentar trabajo si falla la red
                    return@withContext Result.retry()
                }
            }

            // 4. Guardar el nuevo token para la próxima sincronización
            saveChangesToken(changesResponse.nextChangesToken)

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error durante la sincronización de salud", e)
            Result.retry()
        }
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

    private fun sendToBackend(payload: JSONArray): Boolean {
        return try {
            val url = URL("https://api.megaproyecto.com/ingest/health")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true

            val wrapper = JSONObject()
            wrapper.put("health", payload)

            OutputStreamWriter(connection.outputStream).use { it.write(wrapper.toString()) }
            
            val responseCode = connection.responseCode
            responseCode in 200..299
        } catch (e: Exception) {
            Log.e(TAG, "Fallo al enviar datos al backend", e)
            false
        }
    }

    // --- Helpers de Mapeo a HL7 FHIR R4 ---
    
    private fun mapStepsToFhir(record: StepsRecord): JSONObject {
        val obs = JSONObject()
        obs.put("resourceType", "Observation")
        obs.put("status", "final")
        
        val code = JSONObject().apply {
            put("coding", JSONArray().apply {
                put(JSONObject().apply {
                    put("system", "http://loinc.org")
                    put("code", "55423-8")
                    put("display", "Number of steps")
                })
            })
        }
        obs.put("code", code)
        
        val valueQuantity = JSONObject().apply {
            put("value", record.count)
            put("unit", "steps")
        }
        obs.put("valueQuantity", valueQuantity)
        obs.put("effectiveDateTime", record.startTime.toString())
        return obs
    }

    private fun mapHeartRateToFhir(record: HeartRateRecord): JSONObject {
        val obs = JSONObject()
        obs.put("resourceType", "Observation")
        obs.put("status", "final")
        val code = JSONObject().apply {
            put("coding", JSONArray().apply {
                put(JSONObject().apply {
                    put("system", "http://loinc.org")
                    put("code", "8867-4")
                    put("display", "Heart rate")
                })
            })
        }
        obs.put("code", code)
        // En una implementación real, se promediaría o enviaría en serie temporal
        obs.put("effectiveDateTime", record.startTime.toString())
        return obs
    }

    private fun mapSleepToFhir(record: SleepSessionRecord): JSONObject {
        val obs = JSONObject()
        obs.put("resourceType", "Observation")
        obs.put("status", "final")
        val code = JSONObject().apply {
            put("coding", JSONArray().apply {
                put(JSONObject().apply {
                    put("system", "http://loinc.org")
                    put("code", "93832-4")
                    put("display", "Sleep duration")
                })
            })
        }
        obs.put("code", code)
        obs.put("effectiveDateTime", record.startTime.toString())
        return obs
    }

    private fun mapHrvToFhir(record: HeartRateVariabilityRmssdRecord): JSONObject {
        val obs = JSONObject()
        obs.put("resourceType", "Observation")
        obs.put("status", "final")
        val code = JSONObject().apply {
            put("coding", JSONArray().apply {
                put(JSONObject().apply {
                    put("system", "http://loinc.org")
                    put("code", "80404-7")
                    put("display", "R-R interval.standard deviation (Heart rate variability)")
                })
            })
        }
        obs.put("code", code)
        
        val valueQuantity = JSONObject().apply {
            put("value", record.heartRateVariabilityMillis)
            put("unit", "ms")
        }
        obs.put("valueQuantity", valueQuantity)
        obs.put("effectiveDateTime", record.time.toString())
        return obs
    }

    private fun getStoredChangesToken(): String? {
        // TODO: Implementar lectura de SharedPreferences o SQLite
        return null
    }

    private fun saveChangesToken(token: String) {
        // TODO: Implementar escritura en SharedPreferences o SQLite
    }
}
