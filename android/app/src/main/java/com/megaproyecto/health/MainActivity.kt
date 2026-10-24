package com.megaproyecto.health

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.MonetizationOn
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
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import androidx.work.*
import com.megaproyecto.health.finance.ui.FinanceMainScreen
import com.megaproyecto.health.finance.ui.theme.FinanceTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectClient: HealthConnectClient
    private lateinit var requestPermissionLauncher: ActivityResultLauncher<Set<String>>

    private val PREFS_NAME = "MegaProyectoHealthPrefs"
    private val KEY_BACKEND_URL = "key_backend_url"
    private val LEGACY_CLOUD_URL = "https://ais-pre-2ihzxs7iiz7evj5q52apo5-472843269573.us-east1.run.app/api/sync/health"
    private val DEFAULT_URL = "http://192.168.1.8:3000/api/sync/health"

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
                Toast.makeText(this, "Se requieren los permisos biométricos para la sincronización", Toast.LENGTH_LONG).show()
            }
        }

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val storedUrl = prefs.getString(KEY_BACKEND_URL, null)
        val initialUrl = if (storedUrl.isNullOrBlank() || storedUrl == LEGACY_CLOUD_URL) {
            prefs.edit().putString(KEY_BACKEND_URL, DEFAULT_URL).apply()
            DEFAULT_URL
        } else {
            storedUrl
        }

        val openTabExtra = intent?.getStringExtra("OPEN_TAB")
        val initialTopTab = if (openTabExtra == "daily_register" || openTabExtra == "finance") 1 else 0
        val initialFinanceSubTab = if (openTabExtra == "daily_register") 1 else 0

        setContent {
            MainAppRootScreen(
                initialTopTab = initialTopTab,
                initialFinanceSubTab = initialFinanceSubTab,
                initialUrl = initialUrl,
                onSaveUrl = { newUrl ->
                    prefs.edit().putString(KEY_BACKEND_URL, newUrl).apply()
                    Toast.makeText(this, "URL del backend guardada correctamente", Toast.LENGTH_SHORT).show()
                },
                onRequestPermissions = { requestPermissionLauncher.launch(PERMISSIONS) },
                onSyncNow = { triggerImmediateSync() },
                onInspectData = { onDone ->
                    inspectHealthConnectData(onDone)
                },
                getAuditData = {
                    val p = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    AuditInfo(
                        lastTime = p.getString("key_last_sync_time", "Sin registros previos") ?: "Sin registros",
                        status = p.getString("key_last_sync_status", "Pendiente de primer envío") ?: "Pendiente",
                        recordsCount = p.getInt("key_last_sync_records", 0),
                        httpCode = p.getInt("key_last_sync_code", 0)
                    )
                }
            )
        }
    }

    /**
     * Inspecciona los datos reales almacenados en Google Health Connect en este momento
     */
    private fun inspectHealthConnectData(
        onDone: (steps: Long?, hr: Int?, sleepHours: Double?, hrvMs: Double?, statusMsg: String) -> Unit
    ) {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val now = Instant.now()
                val startOfDay = now.truncatedTo(ChronoUnit.DAYS)

                // 1. Pasos acumulados hoy
                val stepsRequest = ReadRecordsRequest(
                    recordType = StepsRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                )
                val stepsResponse = healthConnectClient.readRecords(stepsRequest)
                val totalSteps = stepsResponse.records.sumOf { it.count }

                // 2. Última lectura de ritmo cardíaco (últimas 24h)
                val hrRequest = ReadRecordsRequest(
                    recordType = HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(now.minus(24, ChronoUnit.HOURS), now)
                )
                val hrResponse = healthConnectClient.readRecords(hrRequest)
                val latestHr = hrResponse.records.lastOrNull()?.samples?.lastOrNull()?.beatsPerMinute?.toInt()

                // 3. Duración de sueño (últimas 36h)
                val sleepRequest = ReadRecordsRequest(
                    recordType = SleepSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(now.minus(36, ChronoUnit.HOURS), now)
                )
                val sleepResponse = healthConnectClient.readRecords(sleepRequest)
                val lastSleep = sleepResponse.records.lastOrNull()
                val sleepDuration = lastSleep?.let {
                    Duration.between(it.startTime, it.endTime).toMinutes() / 60.0
                }

                // 4. HRV RMSSD (últimas 48h)
                val hrvRequest = ReadRecordsRequest(
                    recordType = HeartRateVariabilityRmssdRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(now.minus(48, ChronoUnit.HOURS), now)
                )
                val hrvResponse = healthConnectClient.readRecords(hrvRequest)
                val latestHrv = hrvResponse.records.lastOrNull()?.heartRateVariabilityMillis

                withContext(Dispatchers.Main) {
                    onDone(
                        totalSteps,
                        latestHr,
                        sleepDuration,
                        latestHrv,
                        "✅ 4/4 métricas extraídas con éxito de Google Health Connect"
                    )
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    onDone(null, null, null, null, "⚠️ No se pudieron leer datos reales: ${e.message ?: "Permisos pendientes"}")
                }
            }
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
     * Ejecuta una sincronización inmediata de prueba y actualiza la UI
     */
    private fun triggerImmediateSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val oneTimeWork = OneTimeWorkRequestBuilder<HealthSyncWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueue(oneTimeWork)
        Toast.makeText(this, "Transmitiendo datos biométricos reales al backend...", Toast.LENGTH_SHORT).show()
    }
}

data class AuditInfo(
    val lastTime: String,
    val status: String,
    val recordsCount: Int,
    val httpCode: Int
)

@Composable
fun MainAppRootScreen(
    initialTopTab: Int = 0,
    initialFinanceSubTab: Int = 0,
    initialUrl: String,
    onSaveUrl: (String) -> Unit,
    onRequestPermissions: () -> Unit,
    onSyncNow: () -> Unit,
    onInspectData: (onDone: (Long?, Int?, Double?, Double?, String) -> Unit) -> Unit,
    getAuditData: () -> AuditInfo
) {
    var topTabIndex by remember { mutableIntStateOf(initialTopTab) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF0F172A),
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = topTabIndex == 0,
                    onClick = { topTabIndex = 0 },
                    icon = {
                        Icon(
                            imageVector = if (topTabIndex == 0) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                            contentDescription = "Salud Biometría"
                        )
                    },
                    label = {
                        Text(
                            text = "Salud Biometría",
                            fontSize = 11.sp,
                            fontWeight = if (topTabIndex == 0) FontWeight.Bold else FontWeight.Normal
                        )
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF38BDF8),
                        selectedTextColor = Color(0xFF38BDF8),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )

                NavigationBarItem(
                    selected = topTabIndex == 1,
                    onClick = { topTabIndex = 1 },
                    icon = {
                        Icon(
                            imageVector = if (topTabIndex == 1) Icons.Filled.MonetizationOn else Icons.Outlined.MonetizationOn,
                            contentDescription = "Finanzas & Viaje"
                        )
                    },
                    label = {
                        Text(
                            text = "Finanzas & Viaje",
                            fontSize = 11.sp,
                            fontWeight = if (topTabIndex == 1) FontWeight.Bold else FontWeight.Normal
                        )
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFB89947),
                        selectedTextColor = Color(0xFFB89947),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            AnimatedContent(
                targetState = topTabIndex,
                transitionSpec = {
                    fadeIn(animationSpec = tween(200)) togetherWith fadeOut(animationSpec = tween(150))
                },
                label = "MainTopTabTransition"
            ) { tab ->
                when (tab) {
                    0 -> HealthSyncAppScreen(
                        initialUrl = initialUrl,
                        onSaveUrl = onSaveUrl,
                        onRequestPermissions = onRequestPermissions,
                        onSyncNow = onSyncNow,
                        onInspectData = onInspectData,
                        getAuditData = getAuditData
                    )
                    1 -> FinanceTheme {
                        FinanceMainScreen(initialTabIndex = initialFinanceSubTab)
                    }
                }
            }
        }
    }
}

@Composable
fun HealthSyncAppScreen(
    initialUrl: String,
    onSaveUrl: (String) -> Unit,
    onRequestPermissions: () -> Unit,
    onSyncNow: () -> Unit,
    onInspectData: (onDone: (Long?, Int?, Double?, Double?, String) -> Unit) -> Unit,
    getAuditData: () -> AuditInfo
) {
    var urlText by remember { mutableStateOf(initialUrl) }
    val scrollState = rememberScrollState()

    var inspectedSteps by remember { mutableStateOf<Long?>(null) }
    var inspectedHr by remember { mutableStateOf<Int?>(null) }
    var inspectedSleep by remember { mutableStateOf<Double?>(null) }
    var inspectedHrv by remember { mutableStateOf<Double?>(null) }
    var inspectionStatus by remember { mutableStateOf("Pulsa 'Verificar Extracción' para auditar los datos reales de Health Connect.") }
    var isInspecting by remember { mutableStateOf(false) }

    var audit by remember { mutableStateOf(getAuditData()) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0F172A)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(10.dp))
            
            Text(
                text = "MegaProyecto • VYFITH",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Google Health Connect Bridge • Auditoría en Vivo",
                fontSize = 12.sp,
                color = Color(0xFF94A3B8),
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // TARJETA 1: INSPECCIÓN DE DATOS EXTRAÍDOS DE HEALTH CONNECT
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "1. Inspección de Google Health Connect",
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Verifica los valores numéricos extraídos en este instante desde tu teléfono:",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Grid de Métricas
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricBox(
                            label = "Pasos Hoy",
                            value = inspectedSteps?.let { "$it" } ?: "—",
                            unit = "pasos",
                            modifier = Modifier.weight(1f)
                        )
                        MetricBox(
                            label = "FC Reposo",
                            value = inspectedHr?.let { "$it" } ?: "—",
                            unit = "bpm",
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricBox(
                            label = "Sueño",
                            value = inspectedSleep?.let { String.format("%.1f", it) } ?: "—",
                            unit = "horas",
                            modifier = Modifier.weight(1f)
                        )
                        MetricBox(
                            label = "HRV (RMSSD)",
                            value = inspectedHrv?.let { String.format("%.0f", it) } ?: "—",
                            unit = "ms",
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = inspectionStatus,
                        color = Color(0xFFE2E8F0),
                        fontSize = 11.sp
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = {
                            isInspecting = true
                            onInspectData { steps, hr, sleep, hrv, msg ->
                                inspectedSteps = steps
                                inspectedHr = hr
                                inspectedSleep = sleep
                                inspectedHrv = hrv
                                inspectionStatus = msg
                                isInspecting = false
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = if (isInspecting) "Consultando Health Connect..." else "🔍 Verificar Extracción en Health Connect",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // TARJETA 2: AUDITORÍA DE TRANSMISIÓN AL BACKEND
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "2. Auditoría de Sincronización Web (Backend)",
                        color = Color(0xFF10B981),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Confirmación real de recepción de datos por el servidor:",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    AuditRow(label = "Última Sincronización:", value = audit.lastTime)
                    AuditRow(label = "Estado de Servidor:", value = audit.status)
                    AuditRow(label = "Registros FHIR Enviados:", value = "${audit.recordsCount} observaciones")

                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = {
                            onSyncNow()
                            audit = getAuditData()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = "🚀 Sincronizar y Verificar Ahora",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // TARJETA 3: CONFIGURACIÓN DE URL
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "3. Endpoint del Servidor (URL Web):",
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = urlText,
                        onValueChange = { urlText = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color(0xFFE2E8F0),
                            focusedBorderColor = Color(0xFF6366F1),
                            unfocusedBorderColor = Color(0xFF475569),
                            cursorColor = Color(0xFF6366F1)
                        ),
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { onSaveUrl(urlText) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Guardar URL de Destino", color = Color.White, fontSize = 12.sp)
                    }
                }
            }

            // TARJETA 4: PERMISOS HEALTH CONNECT
            Button(
                onClick = onRequestPermissions,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F46E5)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("🔐 Conceder Permisos Health Connect", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }

            Spacer(modifier = Modifier.height(14.dp))

            // TARJETA 5: NOTA EXCLUSIVA DE ENTRENAMIENTOS HEVY
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "ℹ️ Nota Hevy: La subida de exportación CSV de entrenamientos Hevy se gestiona exclusivamente en la plataforma web (Pilar Hevy Workouts) para no saturar memoria en el móvil.",
                    color = Color(0xFF64748B),
                    fontSize = 11.sp,
                    lineHeight = 15.sp,
                    modifier = Modifier.padding(12.dp)
                )
            }
        }
    }
}

@Composable
fun MetricBox(label: String, value: String, unit: String, modifier: Modifier = Modifier) {
    Card(
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(text = label, color = Color(0xFF94A3B8), fontSize = 10.sp)
            Spacer(modifier = Modifier.height(2.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(text = value, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(modifier = Modifier.width(3.dp))
                Text(text = unit, color = Color(0xFF64748B), fontSize = 10.sp)
            }
        }
    }
}

@Composable
fun AuditRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.spaceBetween
    ) {
        Text(text = label, color = Color(0xFF94A3B8), fontSize = 11.sp)
        Text(text = value, color = Color.White, fontWeight = FontWeight.Medium, fontSize = 11.sp)
    }
}
