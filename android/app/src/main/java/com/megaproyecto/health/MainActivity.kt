package com.megaproyecto.health

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.work.*
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectClient: HealthConnectClient
    private lateinit var requestPermissionLauncher: ActivityResultLauncher<Set<String>>

    // Permisos exactos requeridos de Health Connect
    private val PERMISSIONS = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class)
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Verificar disponibilidad de Health Connect
        val availability = HealthConnectClient.getSdkStatus(this)
        if (availability != HealthConnectClient.SDK_AVAILABLE) {
            Toast.makeText(this, "Google Health Connect no está instalado o requiere actualización", Toast.LENGTH_LONG).show()
        }

        healthConnectClient = HealthConnectClient.getOrCreate(this)

        // 2. Registrar el contrato oficial para solicitar permisos
        requestPermissionLauncher = registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { grantedPermissions ->
            if (grantedPermissions.containsAll(PERMISSIONS)) {
                Toast.makeText(this, "Permisos de Health Connect concedidos exitosamente", Toast.LENGTH_SHORT).show()
                schedulePeriodicHealthSync()
            } else {
                Toast.makeText(this, "Se requieren todos los permisos biométricos para la correlación", Toast.LENGTH_LONG).show()
            }
        }

        setContent {
            HealthSyncAppScreen(
                onRequestPermissions = { requestPermissionLauncher.launch(PERMISSIONS) },
                onSyncNow = { triggerImmediateSync() }
            )
        }
    }

    /**
     * Programa la sincronización periódica en segundo plano cada 15 minutos mediante WorkManager
     */
    private fun schedulePeriodicHealthSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val periodicWork = PeriodicWorkRequestBuilder<HealthSyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "MegaProyectoHealthSyncWork",
            ExistingPeriodicWorkPolicy.KEEP,
            periodicWork
        )
    }

    /**
     * Ejecuta una sincronización inmediata de prueba
     */
    private fun triggerImmediateSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val oneTimeWork = OneTimeWorkRequestBuilder<HealthSyncWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueue(oneTimeWork)
        Toast.makeText(this, "Sincronizando deltas con la web en segundo plano...", Toast.LENGTH_SHORT).show()
    }
}

@Composable
fun HealthSyncAppScreen(
    onRequestPermissions: () -> Unit,
    onSyncNow: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0F172A)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "MegaProyecto",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Google Health Connect Bridge",
                fontSize = 14.sp,
                color = Color(0xFF94A3B8),
                modifier = Modifier.padding(bottom = 32.dp)
            )

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Estado: Vinculado a la Web",
                        color = Color(0xFF10B981),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "WorkManager configurado con Changes API para transmitir únicamente deltas biométricos (HL7 FHIR R4) a tu servidor.",
                        color = Color(0xFFCBD5E1),
                        fontSize = 13.sp
                    )
                }
            }

            Button(
                onClick = onRequestPermissions,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F46E5)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("1. Conceder Permisos Health Connect", color = Color.White, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(
                onClick = onSyncNow,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
            ) {
                Text("2. Sincronizar Ahora (Test Inmediato)", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
