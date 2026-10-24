package com.megaproyecto.health.finance.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items

import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FlightTakeoff
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Pets
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.megaproyecto.health.finance.ui.theme.CardBorder
import com.megaproyecto.health.finance.ui.theme.CoralRed
import com.megaproyecto.health.finance.ui.theme.DarkBackground
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceCard
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceElevated
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceInner
import com.megaproyecto.health.finance.ui.theme.EmeraldGreen
import com.megaproyecto.health.finance.ui.theme.HighDensityLavender
import com.megaproyecto.health.finance.ui.theme.HighDensityLavenderDark
import com.megaproyecto.health.finance.ui.theme.HighDensityLavenderSubtle
import com.megaproyecto.health.finance.ui.theme.TextPrimary
import com.megaproyecto.health.finance.ui.theme.TextSecondary
import com.megaproyecto.health.finance.ui.theme.TextTertiary
import com.megaproyecto.health.finance.util.CurrencyUtils
import com.megaproyecto.health.finance.viewmodel.DashboardUiState
import com.megaproyecto.health.finance.viewmodel.GeminiAdvisorUiState
import com.megaproyecto.health.finance.viewmodel.MedellinSimulatorUiState

import com.megaproyecto.health.finance.ui.components.FormattedAnalysisView
import com.megaproyecto.health.finance.ui.theme.NequiPink
import com.megaproyecto.health.finance.ui.theme.HighlightCyan

private data class QuickPromptItem(
    val title: String,
    val query: String,
    val icon: ImageVector
)

@Composable
fun GeminiAdvisorScreen(
    advisorState: GeminiAdvisorUiState,
    dashboardState: DashboardUiState,
    medellinState: MedellinSimulatorUiState,
    onRunAnalysis: (String?) -> Unit,
    onUpdateCustomQuery: (String) -> Unit,
    onToggleNotifications: (Boolean) -> Unit,
    onUpdateReminderTime: (Int, Int) -> Unit,
    onSendTestNotification: () -> Unit
) {
    val context = LocalContext.current

    // Notification permission launcher for Android 13+
    var hasNotificationPermission by remember {
        mutableStateOf(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            } else {
                true
            }
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasNotificationPermission = isGranted
        if (isGranted) {
            onToggleNotifications(true)
        }
    }

    // Auto-run analysis on first view if no analysis yet
    LaunchedEffect(Unit) {
        if (advisorState.analysisText == null && !advisorState.isAnalyzing) {
            onRunAnalysis(null)
        }
    }

    val quickPrompts = remember {
        listOf(
            QuickPromptItem(
                title = "👨‍👦 Abono de Papá & Pronóstico",
                query = "¿Cómo voy para el viaje considerando los $450.000 que me dará mi papá (ya me dio $140.000 y faltan $310.000)? ¿Cuál es mi meta personal real?",
                icon = Icons.Default.Person
            ),
            QuickPromptItem(
                title = "¿Voy bien o mal para Medellín?",
                query = "¿Voy bien para el viaje a Medellín o voy mal? Dame un diagnóstico honesto de mi viabilidad y pronóstico.",
                icon = Icons.Default.FlightTakeoff
            ),
            QuickPromptItem(
                title = "🐾 ¿Cuántos paseos necesito?",
                query = "Calcula exactamente cuántos paseos de Sienna ($9.000) o Frida ($5.850) necesito para cubrir mi meta personal restante.",
                icon = Icons.Default.Pets
            ),
            QuickPromptItem(
                title = "🚀 Plan Rappi & Ahorro",
                query = "¿Cuántos turnos de Rappi y qué estrategia de ahorro semanal me recomiendas para asegurar el viaje?",
                icon = Icons.Default.TrendingUp
            )
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .testTag("gemini_advisor_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // High Density Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        modifier = Modifier.size(42.dp),
                        shape = RectangleShape,
                        color = DarkSurfaceElevated,
                        border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(text = "🔮", fontSize = 22.sp)
                        }
                    }
                    Column {
                        Text(
                            text = "Oráculo Gemini IA",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.testTag("gemini_advisor_title")
                        )
                        Text(
                            text = "🔮 PROFECÍAS & SABIDURÍA 16-BIT",
                            fontSize = 10.sp,
                            letterSpacing = 2.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = HighDensityLavenderSubtle
                        )
                    }
                }

                IconButton(
                    onClick = { onRunAnalysis(null) },
                    enabled = !advisorState.isAnalyzing,
                    modifier = Modifier.testTag("refresh_gemini_analysis_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Actualizar análisis",
                        tint = HighDensityLavender
                    )
                }
            }
        }

        // Live Viability Status Card
        item {
            ViabilityStatusCard(
                dashboardState = dashboardState,
                medellinState = medellinState,
                isAnalyzing = advisorState.isAnalyzing,
                onReanalyze = { onRunAnalysis(null) }
            )
        }

        // Quick Prompt Chips
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Preguntas Rápidas a Gemini",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = HighDensityLavender
                )

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(quickPrompts) { item ->
                        Surface(
                            modifier = Modifier
                                .clip(RectangleShape)
                                .clickable(enabled = !advisorState.isAnalyzing) {
                                    onRunAnalysis(item.query)
                                },
                            shape = RectangleShape,
                            color = DarkSurfaceInner,
                            border = BorderStroke(1.dp, CardBorder)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = null,
                                    tint = HighDensityLavender,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = item.title,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Medium,
                                    color = TextPrimary
                                )
                            }
                        }
                    }
                }
            }
        }

        // Custom Query Input
        item {
            Card(
                shape = RectangleShape,
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                border = BorderStroke(1.dp, CardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = advisorState.customQueryInput,
                        onValueChange = onUpdateCustomQuery,
                        placeholder = {
                            Text(
                                "¿Tienes otra duda sobre tus gastos o paseos?",
                                color = TextTertiary,
                                fontSize = 12.sp
                            )
                        },
                        singleLine = true,
                        shape = RectangleShape,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = HighDensityLavender,
                            unfocusedBorderColor = CardBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedContainerColor = DarkSurfaceInner,
                            unfocusedContainerColor = DarkSurfaceInner
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("gemini_custom_query_input")
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    IconButton(
                        onClick = {
                            if (advisorState.customQueryInput.isNotBlank()) {
                                onRunAnalysis(advisorState.customQueryInput)
                            }
                        },
                        enabled = advisorState.customQueryInput.isNotBlank() && !advisorState.isAnalyzing,
                        modifier = Modifier
                            .background(
                                if (advisorState.customQueryInput.isNotBlank()) HighDensityLavender else DarkSurfaceElevated,
                                RectangleShape
                            )
                            .testTag("send_gemini_query_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Enviar pregunta",
                            tint = if (advisorState.customQueryInput.isNotBlank()) HighDensityLavenderDark else TextTertiary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        // AI Response / Diagnosis Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("gemini_analysis_result_card"),
                shape = RectangleShape,
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                border = BorderStroke(1.dp, CardBorder)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = HighDensityLavender,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "Diagnóstico Financiero Gemini",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }

                        if (advisorState.isAnalyzing) {
                            Text(
                                text = "⏳ CONJURANDO...",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = HighDensityLavender
                            )
                        }
                    }

                    if (advisorState.isAnalyzing) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "🔮 Conjurando sabiduría del Oráculo Gemini...",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth(0.8f)
                                    .height(14.dp),
                                shape = RectangleShape,
                                color = DarkBackground,
                                border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder)
                            ) {
                                LinearProgressIndicator(
                                    color = HighDensityLavender,
                                    trackColor = DarkSurfaceElevated,
                                    strokeCap = androidx.compose.ui.graphics.StrokeCap.Square,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                            Text(
                                text = "Analizando arcas, tributos de papá y viabilidad de Medellín...",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                    } else if (advisorState.analysisText != null) {
                        SelectionContainer {
                            FormattedAnalysisView(
                                rawText = advisorState.analysisText,
                                modifier = Modifier.testTag("gemini_analysis_text")
                            )
                        }
                    } else {
                        Text(
                            text = "Presiona 'Actualizar análisis' o una pregunta rápida para obtener la evaluación de Gemini con el pronóstico de tu viaje y el abono de tu papá.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                }
            }
        }

        // Daily Notification Settings Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("daily_notification_settings_card"),
                shape = RectangleShape,
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                border = BorderStroke(1.dp, CardBorder)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                modifier = Modifier.size(36.dp),
                                shape = RectangleShape,
                                color = HighDensityLavender.copy(alpha = 0.15f)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = if (advisorState.notificationsEnabled) Icons.Default.NotificationsActive else Icons.Default.Notifications,
                                        contentDescription = null,
                                        tint = HighDensityLavender,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }

                            Column {
                                Text(
                                    text = "Recordatorio Diario",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Paseos de perros y gastos de hoy",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        Switch(
                            checked = advisorState.notificationsEnabled,
                            onCheckedChange = { isChecked ->
                                if (isChecked && !hasNotificationPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                    permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                } else {
                                    onToggleNotifications(isChecked)
                                }
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = HighDensityLavenderDark,
                                checkedTrackColor = HighDensityLavender,
                                uncheckedThumbColor = TextTertiary,
                                uncheckedTrackColor = DarkSurfaceElevated
                            ),
                            modifier = Modifier.testTag("notification_toggle_switch")
                        )
                    }

                    Text(
                        text = "Recibe una alerta cada noche para preguntarte en qué gastaste hoy la plata y qué paseos hiciste (Sienna, Frida o Rappi).",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        lineHeight = 18.sp
                    )

                    // Preset Times Selection
                    AnimatedVisibility(visible = advisorState.notificationsEnabled) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = "Hora del recordatorio:",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = HighDensityLavender
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                val timeOptions = listOf(
                                    Pair(19, 0) to "7:00 PM",
                                    Pair(20, 0) to "8:00 PM",
                                    Pair(21, 0) to "9:00 PM",
                                    Pair(22, 0) to "10:00 PM"
                                )

                                timeOptions.forEach { (time, label) ->
                                    val isSelected = advisorState.reminderHour == time.first && advisorState.reminderMinute == time.second
                                    Surface(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RectangleShape)
                                            .clickable {
                                                onUpdateReminderTime(time.first, time.second)
                                            },
                                        shape = RectangleShape,
                                        color = if (isSelected) HighDensityLavender else DarkSurfaceInner,
                                        border = BorderStroke(1.dp, if (isSelected) HighDensityLavender else CardBorder)
                                    ) {
                                        Box(
                                            modifier = Modifier.padding(vertical = 8.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = label,
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                                color = if (isSelected) HighDensityLavenderDark else TextPrimary,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Test notification action button
                    OutlinedButton(
                        onClick = {
                            if (!hasNotificationPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                            } else {
                                onSendTestNotification()
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("test_notification_button"),
                        shape = RectangleShape,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Icon(
                            imageVector = Icons.Default.NotificationsActive,
                            contentDescription = null,
                            tint = HighDensityLavender,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Enviar Notificación de Prueba Ahora",
                            color = HighDensityLavender,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ViabilityStatusCard(
    dashboardState: DashboardUiState,
    medellinState: MedellinSimulatorUiState,
    isAnalyzing: Boolean,
    onReanalyze: () -> Unit
) {
    val isProjectedSurplus = medellinState.isProjectedSurplusWithDad
    val statusColor = if (isProjectedSurplus) EmeraldGreen else CoralRed

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("viability_status_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = BorderStroke(1.dp, statusColor.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        modifier = Modifier.size(10.dp),
                        shape = RectangleShape,
                        color = statusColor
                    ) {}
                    Text(
                        text = if (isProjectedSurplus) "PRONÓSTICO: VIAJE VIABLE (CON PAPÁ)" else "PRONÓSTICO: AJUSTADO",
                        fontSize = 11.sp,
                        letterSpacing = 1.sp,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }

                Surface(
                    shape = RectangleShape,
                    color = statusColor.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = "Abono Papá: ${(medellinState.dadProgressPercent * 100).toInt()}%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = statusColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            // Summary metrics
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text(
                        text = "Meta Total Medellín",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = CurrencyUtils.formatCOP(medellinState.totalEstimatedCost),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Tu Aporte Personal Real",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                    Text(
                        text = CurrencyUtils.formatCOP(medellinState.personalRemainingTarget),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = HighDensityLavender
                    )
                }
            }

            // Dad contribution pill
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RectangleShape,
                color = DarkSurfaceInner,
                border = BorderStroke(1.dp, NequiPink.copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = NequiPink,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Abono Papá (${CurrencyUtils.formatCOP(medellinState.dadPaidAmount)} / ${CurrencyUtils.formatCOP(medellinState.dadTotalCommitted)}):",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }

                    Text(
                        text = "Falta ${CurrencyUtils.formatCOP(medellinState.dadPendingAmount)}",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = NequiPink
                    )
                }
            }

            // Liquid accounts pill
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RectangleShape,
                color = DarkSurfaceInner,
                border = BorderStroke(1.dp, CardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Excedente Líquido en Cuentas:",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                    Text(
                        text = CurrencyUtils.formatCOP(dashboardState.excedenteLiquidoLibre),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = HighDensityLavender
                    )
                }
            }
        }
    }
}
