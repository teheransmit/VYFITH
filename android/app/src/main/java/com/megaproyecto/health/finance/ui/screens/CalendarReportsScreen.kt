package com.megaproyecto.health.finance.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items

import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.DeliveryDining
import androidx.compose.material.icons.filled.FlightTakeoff
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Pets
import androidx.compose.material.icons.filled.Refresh
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
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.ui.components.MedellinBudgetVsExpensesChart
import com.megaproyecto.health.finance.ui.theme.CardBorder
import com.megaproyecto.health.finance.ui.theme.CardBorderSubtle
import com.megaproyecto.health.finance.ui.theme.CashGold
import com.megaproyecto.health.finance.ui.theme.CoralRed
import com.megaproyecto.health.finance.ui.theme.DarkBackground
import com.megaproyecto.health.finance.ui.theme.DarkSurface
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceCard
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceElevated
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceInner
import com.megaproyecto.health.finance.ui.theme.EmeraldGreen
import com.megaproyecto.health.finance.ui.theme.EmeraldGreenDark
import com.megaproyecto.health.finance.ui.theme.HighDensityLavender
import com.megaproyecto.health.finance.ui.theme.HighDensityLavenderDark
import com.megaproyecto.health.finance.ui.theme.NequiPink
import com.megaproyecto.health.finance.ui.theme.NuPurple
import com.megaproyecto.health.finance.ui.theme.TextPrimary
import com.megaproyecto.health.finance.ui.theme.TextSecondary
import com.megaproyecto.health.finance.ui.theme.TextTertiary
import com.megaproyecto.health.finance.util.CurrencyUtils
import com.megaproyecto.health.finance.viewmodel.CalendarReportsUiState
import java.util.Calendar

@Composable
fun CalendarReportsScreen(
    state: CalendarReportsUiState,
    dailyLogs: List<DailyLog>,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onResetToToday: () -> Unit,
    onSelectDay: (Int?) -> Unit,
    onGenerateGeminiReport: () -> Unit,
    modifier: Modifier = Modifier
) {
    val monthNames = remember {
        arrayOf(
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        )
    }

    val currentMonthName = "${monthNames.getOrElse(state.selectedMonth) { "Mes" }} ${state.selectedYear}"

    // Calculate logs for the selected month
    val monthLogs = remember(dailyLogs, state.selectedYear, state.selectedMonth) {
        dailyLogs.filter { log ->
            val cal = Calendar.getInstance().apply { timeInMillis = log.timestamp }
            cal.get(Calendar.YEAR) == state.selectedYear && cal.get(Calendar.MONTH) == state.selectedMonth
        }
    }

    // Map day of month -> List of logs on that day
    val logsByDay = remember(monthLogs) {
        monthLogs.groupBy { log ->
            val cal = Calendar.getInstance().apply { timeInMillis = log.timestamp }
            cal.get(Calendar.DAY_OF_MONTH)
        }
    }

    val todayCal = remember { Calendar.getInstance() }
    val isFutureMonth = remember(state.selectedYear, state.selectedMonth) {
        val currentYear = todayCal.get(Calendar.YEAR)
        val currentMonth = todayCal.get(Calendar.MONTH)
        (state.selectedYear > currentYear) || (state.selectedYear == currentYear && state.selectedMonth > currentMonth)
    }

    // Days in selected month
    val daysInSelectedMonth = remember(state.selectedYear, state.selectedMonth) {
        val cal = Calendar.getInstance().apply {
            set(Calendar.YEAR, state.selectedYear)
            set(Calendar.MONTH, state.selectedMonth)
            set(Calendar.DAY_OF_MONTH, 1)
        }
        cal.getActualMaximum(Calendar.DAY_OF_MONTH)
    }

    // Identify projected Mondays ($35,000 COP - Aporte papá para ahorro pasajes)
    val projectedMondaysMap = remember(state.selectedYear, state.selectedMonth, daysInSelectedMonth, logsByDay) {
        val map = mutableMapOf<Int, Double>()
        for (day in 1..daysInSelectedMonth) {
            val cal = Calendar.getInstance().apply {
                set(Calendar.YEAR, state.selectedYear)
                set(Calendar.MONTH, state.selectedMonth)
                set(Calendar.DAY_OF_MONTH, day)
            }
            val isMonday = cal.get(Calendar.DAY_OF_WEEK) == Calendar.MONDAY
            val isFutureDay = (state.selectedYear > todayCal.get(Calendar.YEAR)) ||
                    (state.selectedYear == todayCal.get(Calendar.YEAR) && state.selectedMonth > todayCal.get(Calendar.MONTH)) ||
                    (state.selectedYear == todayCal.get(Calendar.YEAR) && state.selectedMonth == todayCal.get(Calendar.MONTH) && day >= todayCal.get(Calendar.DAY_OF_MONTH))

            val hasRealLogs = logsByDay[day]?.any { (it.walksIncome + it.rappiIncome) > 0 } == true
            if (isMonday && isFutureDay && !hasRealLogs) {
                map[day] = 35000.0
            }
        }
        map
    }

    val projectedMonthlyAmount = remember(projectedMondaysMap) {
        projectedMondaysMap.values.sum()
    }

    // Calculate dynamic monthly accumulated earnings (real + projected)
    val monthlyRealGrossIncome = remember(monthLogs) {
        monthLogs.sumOf { it.walksIncome + it.rappiIncome }
    }
    val monthlyGrossIncome = remember(monthlyRealGrossIncome, projectedMonthlyAmount) {
        monthlyRealGrossIncome + projectedMonthlyAmount
    }
    val monthlyWalksIncome = remember(monthLogs) {
        monthLogs.sumOf { it.walksIncome }
    }
    val monthlyRappiIncome = remember(monthLogs) {
        monthLogs.sumOf { it.rappiIncome }
    }
    val activeDaysCount = remember(logsByDay, projectedMondaysMap) {
        val realDays = logsByDay.count { (_, logs) -> logs.any { (it.walksIncome + it.rappiIncome) > 0 } }
        val projectedDays = projectedMondaysMap.keys.count { !logsByDay.containsKey(it) }
        realDays + projectedDays
    }

    // Calculate dynamic weekly accumulated earnings
    // If viewing a future month, week reflects the projected weekly contribution of dad ($35,000 COP)
    val weeklyGrossIncome = remember(dailyLogs, isFutureMonth) {
        if (isFutureMonth) {
            35000.0
        } else {
            val calLimit = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, -7)
            }
            dailyLogs.filter { it.timestamp >= calLimit.timeInMillis }
                .sumOf { it.walksIncome + it.rappiIncome }
        }
    }
    val weeklyWalksIncome = remember(dailyLogs, isFutureMonth) {
        if (isFutureMonth) {
            0.0
        } else {
            val calLimit = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, -7)
            }
            dailyLogs.filter { it.timestamp >= calLimit.timeInMillis }
                .sumOf { it.walksIncome }
        }
    }
    val weeklyRappiIncome = remember(dailyLogs, isFutureMonth) {
        if (isFutureMonth) {
            0.0
        } else {
            val calLimit = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, -7)
            }
            dailyLogs.filter { it.timestamp >= calLimit.timeInMillis }
                .sumOf { it.rappiIncome }
        }
    }

    // Selected day logs and projection
    val selectedDayLogs = remember(logsByDay, state.selectedDay) {
        state.selectedDay?.let { logsByDay[it] } ?: emptyList()
    }
    val selectedDayProjectedAmount = remember(projectedMondaysMap, state.selectedDay) {
        state.selectedDay?.let { projectedMondaysMap[it] } ?: 0.0
    }

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground),
        containerColor = DarkBackground
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("calendar_reports_screen"),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 120.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "Calendario & Reportes",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Black,
                                color = TextPrimary
                            )
                            Surface(
                                shape = RectangleShape,
                                color = HighDensityLavender.copy(alpha = 0.15f)
                            ) {
                                Box(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "IA Report",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = HighDensityLavender
                                    )
                                }
                            }
                        }
                        Text(
                            text = "Ganancias por día, métricas semanales y proyección",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }
            }

            // SECTION 1: Monthly Calendar
            item {
                MonthlyCalendarCard(
                    monthTitle = currentMonthName,
                    year = state.selectedYear,
                    month = state.selectedMonth,
                    logsByDay = logsByDay,
                    projectedMondaysMap = projectedMondaysMap,
                    selectedDay = state.selectedDay,
                    onPreviousMonth = onPreviousMonth,
                    onNextMonth = onNextMonth,
                    onResetToToday = onResetToToday,
                    onSelectDay = { day ->
                        if (state.selectedDay == day) {
                            onSelectDay(null)
                        } else {
                            onSelectDay(day)
                        }
                    }
                )
            }

            // Selected Day Details Expansion (if a day is clicked)
            if (state.selectedDay != null) {
                item {
                    SelectedDayDetailCard(
                        day = state.selectedDay,
                        monthName = monthNames.getOrElse(state.selectedMonth) { "Mes" },
                        year = state.selectedYear,
                        logs = selectedDayLogs,
                        projectedAmount = selectedDayProjectedAmount,
                        onClose = { onSelectDay(null) }
                    )
                }
            }

            // SECTION 2: Dynamic Summary Cards (Weekly & Monthly)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isFutureMonth) "Resumen Proyectado de Ganancias" else "Resumen Dinámico de Ganancias",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    if (isFutureMonth) {
                        Surface(
                            shape = RectangleShape,
                            color = CashGold.copy(alpha = 0.15f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, CashGold.copy(alpha = 0.4f))
                        ) {
                            Text(
                                text = "Proyección Futura",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = CashGold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Card 1: Ganancia Semanal (Acumulada o Proyectada)
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .testTag("weekly_accumulated_card"),
                        shape = RectangleShape,
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (isFutureMonth) CashGold.copy(alpha = 0.35f) else CardBorder)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RectangleShape,
                                    color = if (isFutureMonth) CashGold.copy(alpha = 0.18f) else HighDensityLavender.copy(alpha = 0.18f),
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.DateRange,
                                            contentDescription = null,
                                            tint = if (isFutureMonth) CashGold else HighDensityLavender,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                                Surface(
                                    shape = RectangleShape,
                                    color = if (isFutureMonth) CashGold.copy(alpha = 0.2f) else DarkSurfaceElevated
                                ) {
                                    Text(
                                        text = if (isFutureMonth) "PROYECCIÓN" else "7 DÍAS",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isFutureMonth) CashGold else TextTertiary,
                                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Column {
                                Text(
                                    text = if (isFutureMonth) "Ganancia Semanal (Proy.)" else "Ganancia Semanal",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.5.sp
                                )
                                Text(
                                    text = CurrencyUtils.formatCOP(weeklyGrossIncome),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Black,
                                    color = if (isFutureMonth) CashGold else EmeraldGreen,
                                    fontSize = 18.sp
                                )
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                if (isFutureMonth) {
                                    Text(
                                        text = "👨‍👦 Aporte semanal papá",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextSecondary,
                                        fontSize = 10.5.sp
                                    )
                                    Text(
                                        text = "$35.000 COP cada lunes",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextTertiary,
                                        fontSize = 9.5.sp
                                    )
                                } else {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "🐾 Paseos:", style = MaterialTheme.typography.labelSmall, color = TextTertiary, fontSize = 10.5.sp)
                                        Text(text = CurrencyUtils.formatCOP(weeklyWalksIncome), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = TextSecondary, fontSize = 10.5.sp)
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "🛵 Rappi:", style = MaterialTheme.typography.labelSmall, color = TextTertiary, fontSize = 10.5.sp)
                                        Text(text = CurrencyUtils.formatCOP(weeklyRappiIncome), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = TextSecondary, fontSize = 10.5.sp)
                                    }
                                }
                            }
                        }
                    }

                    // Card 2: Ganancia Mensual Acumulada
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .testTag("monthly_accumulated_card"),
                        shape = RectangleShape,
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (isFutureMonth) CashGold.copy(alpha = 0.35f) else CardBorder)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RectangleShape,
                                    color = CashGold.copy(alpha = 0.18f),
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.CalendarMonth,
                                            contentDescription = null,
                                            tint = CashGold,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                                Surface(
                                    shape = RectangleShape,
                                    color = if (isFutureMonth) CashGold.copy(alpha = 0.2f) else DarkSurfaceElevated
                                ) {
                                    Text(
                                        text = if (isFutureMonth) "${projectedMondaysMap.size} LUNES" else "$activeDaysCount DÍAS",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isFutureMonth) CashGold else TextTertiary,
                                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Column {
                                Text(
                                    text = if (isFutureMonth) "Ganancia Mensual (Proy.)" else "Ganancia Mensual",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.5.sp
                                )
                                Text(
                                    text = CurrencyUtils.formatCOP(monthlyGrossIncome),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Black,
                                    color = CashGold,
                                    fontSize = 18.sp
                                )
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                if (isFutureMonth) {
                                    Text(
                                        text = "✦ ${projectedMondaysMap.size} lunes proyectados",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextSecondary,
                                        fontSize = 10.5.sp
                                    )
                                    Text(
                                        text = "Total mes: ${CurrencyUtils.formatCOP(projectedMonthlyAmount)}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextTertiary,
                                        fontSize = 9.5.sp
                                    )
                                } else {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "🐾 Paseos:", style = MaterialTheme.typography.labelSmall, color = TextTertiary, fontSize = 10.5.sp)
                                        Text(text = CurrencyUtils.formatCOP(monthlyWalksIncome), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = TextSecondary, fontSize = 10.5.sp)
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(text = "🛵 Rappi:", style = MaterialTheme.typography.labelSmall, color = TextTertiary, fontSize = 10.5.sp)
                                        Text(text = CurrencyUtils.formatCOP(monthlyRappiIncome), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = TextSecondary, fontSize = 10.5.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Medellín Trip Capital Projection Card (October 2026 Target)
            item {
                MedellinOctoberProjectionBanner()
            }

            // Gráfico Recharts de Barras: Gastos Mensuales vs Presupuesto Medellín
            item {
                MedellinBudgetVsExpensesChart(
                    dailyLogs = dailyLogs,
                    totalTripBudget = 585451.0
                )
            }

            // SECTION 3 & 4: Análisis Inteligente (Generar Reporte Gemini)
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("gemini_intelligent_analysis_section"),
                    shape = RectangleShape,
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, HighDensityLavender.copy(alpha = 0.4f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = RectangleShape,
                                color = DarkSurfaceElevated,
                                border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder),
                                modifier = Modifier.size(42.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(text = "🔮", fontSize = 20.sp)
                                }
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Oráculo Inteligente",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Balance del mes y proyección para el viaje a Medellín",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }
                        }

                        // Prominent Button: Generar Reporte Gemini (16-bit block style)
                        Button(
                            onClick = onGenerateGeminiReport,
                            enabled = !state.isGeneratingReport,
                            shape = RectangleShape,
                            border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = HighDensityLavender,
                                contentColor = HighDensityLavenderDark
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("generate_gemini_report_button")
                        ) {
                            if (state.isGeneratingReport) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = "⏳ INVOCANDO ORÁCULO GEMINI...",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    LinearProgressIndicator(
                                        color = HighDensityLavenderDark,
                                        trackColor = HighDensityLavender.copy(alpha = 0.5f),
                                        modifier = Modifier
                                            .fillMaxWidth(0.6f)
                                            .height(4.dp)
                                    )
                                }
                            } else {
                                Text(
                                    text = if (state.geminiReportText != null) "🔮 REINVOCAR ORÁCULO GEMINI" else "🔮 INVOCAR ORÁCULO GEMINI",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Generated Gemini Report Card
                        AnimatedVisibility(
                            visible = state.geminiReportText != null,
                            enter = fadeIn() + slideInVertically(),
                            exit = fadeOut() + slideOutVertically()
                        ) {
                            state.geminiReportText?.let { reportText ->
                                Card(
                                    shape = RectangleShape,
                                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceInner),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderSubtle),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("gemini_monthly_report_card")
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.AutoAwesome,
                                                    contentDescription = null,
                                                    tint = HighDensityLavender,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Text(
                                                    text = "Reporte Gemini IA",
                                                    style = MaterialTheme.typography.labelLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = HighDensityLavender
                                                )
                                            }

                                            Surface(
                                                shape = RectangleShape,
                                                color = EmeraldGreen.copy(alpha = 0.15f)
                                            ) {
                                                Text(
                                                    text = "GENERADO",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Black,
                                                    color = EmeraldGreen,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                        }

                                        // Render structured Markdown / sections cleanly
                                        Text(
                                            text = reportText,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = TextPrimary,
                                            lineHeight = 22.sp,
                                            modifier = Modifier.testTag("gemini_report_content_text")
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MonthlyCalendarCard(
    monthTitle: String,
    year: Int,
    month: Int,
    logsByDay: Map<Int, List<DailyLog>>,
    projectedMondaysMap: Map<Int, Double> = emptyMap(),
    selectedDay: Int?,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onResetToToday: () -> Unit,
    onSelectDay: (Int) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("monthly_calendar_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Month Navigation Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onPreviousMonth,
                    modifier = Modifier
                        .size(36.dp)
                        .testTag("btn_prev_month")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Mes anterior",
                        tint = TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = monthTitle,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Surface(
                        shape = RectangleShape,
                        color = DarkSurfaceElevated,
                        modifier = Modifier.clickable { onResetToToday() }
                    ) {
                        Text(
                            text = "Hoy",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = HighDensityLavender,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                IconButton(
                    onClick = onNextMonth,
                    modifier = Modifier
                        .size(36.dp)
                        .testTag("btn_next_month")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Mes siguiente",
                        tint = TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // Days of Week Header (Lun, Mar, Mié, Jue, Vie, Sáb, Dom)
            val weekDays = listOf("Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                weekDays.forEach { dayName ->
                    Text(
                        text = dayName,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = TextTertiary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Compute calendar days grid
            val calendar = Calendar.getInstance().apply {
                set(Calendar.YEAR, year)
                set(Calendar.MONTH, month)
                set(Calendar.DAY_OF_MONTH, 1)
            }

            val daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
            // Day of week for 1st day of month (SUNDAY=1, MONDAY=2, etc.)
            val firstDayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
            // Convert to Monday=0, Tuesday=1, ..., Sunday=6
            val offset = if (firstDayOfWeek == Calendar.SUNDAY) 6 else firstDayOfWeek - 2

            val todayCal = Calendar.getInstance()
            val isCurrentYearMonth = todayCal.get(Calendar.YEAR) == year && todayCal.get(Calendar.MONTH) == month
            val todayDay = if (isCurrentYearMonth) todayCal.get(Calendar.DAY_OF_MONTH) else -1

            val totalSlots = offset + daysInMonth
            val totalRows = (totalSlots + 6) / 7

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                for (row in 0 until totalRows) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        for (col in 0 until 7) {
                            val slotIndex = row * 7 + col
                            val dayNum = slotIndex - offset + 1

                            if (dayNum in 1..daysInMonth) {
                                val dayLogs = logsByDay[dayNum] ?: emptyList()
                                val dayEarnings = dayLogs.sumOf { it.walksIncome + it.rappiIncome }
                                val hasRealIncome = dayEarnings > 0
                                val projectedIncome = projectedMondaysMap[dayNum] ?: 0.0
                                val isProjected = !hasRealIncome && projectedIncome > 0
                                val displayEarnings = if (hasRealIncome) dayEarnings else projectedIncome
                                val hasIncome = hasRealIncome || isProjected
                                val isToday = dayNum == todayDay
                                val isSelected = dayNum == selectedDay

                                CalendarDayCell(
                                    day = dayNum,
                                    earnings = displayEarnings,
                                    hasIncome = hasIncome,
                                    isProjected = isProjected,
                                    isToday = isToday,
                                    isSelected = isSelected,
                                    onClick = { onSelectDay(dayNum) },
                                    modifier = Modifier.weight(1f)
                                )
                            } else {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CalendarDayCell(
    day: Int,
    earnings: Double,
    hasIncome: Boolean,
    isProjected: Boolean = false,
    isToday: Boolean,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val backgroundColor = when {
        isSelected -> HighDensityLavender.copy(alpha = 0.22f)
        isProjected -> CashGold.copy(alpha = 0.15f)
        hasIncome -> EmeraldGreen.copy(alpha = 0.12f)
        isToday -> DarkSurfaceElevated
        else -> Color.Transparent
    }

    val borderColor = when {
        isSelected -> HighDensityLavender
        isToday -> HighDensityLavender.copy(alpha = 0.6f)
        isProjected -> CashGold.copy(alpha = 0.5f)
        hasIncome -> EmeraldGreen.copy(alpha = 0.35f)
        else -> Color.Transparent
    }

    Box(
        modifier = modifier
            .padding(2.dp)
            .height(52.dp)
            .clip(RectangleShape)
            .background(backgroundColor)
            .border(1.dp, borderColor, RectangleShape)
            .clickable { onClick() }
            .padding(vertical = 4.dp, horizontal = 2.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            Text(
                text = day.toString(),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isToday || hasIncome || isSelected || isProjected) FontWeight.Bold else FontWeight.Normal,
                color = when {
                    isSelected -> HighDensityLavender
                    isProjected -> CashGold
                    isToday -> TextPrimary
                    hasIncome -> TextPrimary
                    else -> TextSecondary
                },
                fontSize = 13.sp
            )

            if (hasIncome) {
                Text(
                    text = if (isProjected) "+$35k" else CurrencyUtils.formatCompactCOP(earnings),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Black,
                    color = if (isProjected) CashGold else EmeraldGreen,
                    fontSize = 8.5.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun SelectedDayDetailCard(
    day: Int,
    monthName: String,
    year: Int,
    logs: List<DailyLog>,
    projectedAmount: Double = 0.0,
    onClose: () -> Unit
) {
    val totalIncome = logs.sumOf { it.walksIncome + it.rappiIncome }
    val totalExpense = logs.sumOf { it.dailyExpense }
    val netDay = totalIncome - totalExpense

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("selected_day_details_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, HighDensityLavender.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
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
                        shape = RectangleShape,
                        color = HighDensityLavender.copy(alpha = 0.2f),
                        modifier = Modifier.size(32.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = day.toString(),
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Black,
                                color = HighDensityLavender
                            )
                        }
                    }
                    Column {
                        Text(
                            text = "Detalle del $day de $monthName, $year",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = when {
                                logs.isNotEmpty() -> "${logs.size} registro(s) guardado(s)"
                                projectedAmount > 0 -> "Ingreso proyectado (Aporte semanal de papá)"
                                else -> "Sin registros en esta fecha"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }

                IconButton(
                    onClick = onClose,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Cerrar detalle",
                        tint = TextTertiary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            if (logs.isEmpty() && projectedAmount > 0) {
                Card(
                    shape = RectangleShape,
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceInner),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CashGold.copy(alpha = 0.45f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
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
                                    shape = RectangleShape,
                                    color = CashGold.copy(alpha = 0.2f),
                                    modifier = Modifier.size(34.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(text = "👨‍👦", fontSize = 16.sp)
                                    }
                                }
                                Column {
                                    Text(
                                        text = "Aporte Semanal Papá (Proyectado)",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "Ahorro pasajes viaje a Medellín",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                            Text(
                                text = "+${CurrencyUtils.formatCOP(projectedAmount)}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Black,
                                color = CashGold
                            )
                        }
                        Text(
                            text = "💡 Cada lunes está proyectado con este aporte fijo de $35.000 COP para simular el capital que tendrás acumulado para tu viaje en octubre.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextTertiary,
                            fontSize = 11.sp
                        )
                    }
                }
            } else if (logs.isNotEmpty()) {
                logs.forEach { log ->
                    Card(
                        shape = RectangleShape,
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceInner),
                        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderSubtle),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    if (log.siennaWalk) {
                                        Text(text = "🐾 Sienna ($9k)", style = MaterialTheme.typography.labelSmall, color = HighDensityLavender)
                                    }
                                    if (log.fridaWalk) {
                                        Text(text = "🐾 Frida ($5.8k)", style = MaterialTheme.typography.labelSmall, color = HighDensityLavender)
                                    }

                                }
                                Text(
                                    text = "→ ${log.targetAccountName}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextSecondary
                                )
                            }

                            if (log.rappiIncome > 0) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = "🛵 Rappi:", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                                    Text(text = CurrencyUtils.formatCOP(log.rappiIncome), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = EmeraldGreen)
                                }
                            }

                            if (log.dailyExpense > 0) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = "💸 Gasto:", style = MaterialTheme.typography.bodySmall, color = CoralRed)
                                    Text(text = "-${CurrencyUtils.formatCOP(log.dailyExpense)}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = CoralRed)
                                }
                            }

                            if (log.note.isNotBlank()) {
                                Text(
                                    text = "Nota: ${log.note}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextTertiary,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }

                // Day Total Summary Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Ganancia neta del día:",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = CurrencyUtils.formatCOP(netDay),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = if (netDay >= 0) EmeraldGreen else CoralRed
                    )
                }
            }
        }
    }
}

@Composable
fun MedellinOctoberProjectionBanner() {
    val mondaysCount = remember {
        var count = 0
        val cal = Calendar.getInstance()
        val endCal = Calendar.getInstance().apply {
            set(Calendar.YEAR, 2026)
            set(Calendar.MONTH, Calendar.OCTOBER)
            set(Calendar.DAY_OF_MONTH, 31)
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
        }
        while (cal.before(endCal)) {
            if (cal.get(Calendar.DAY_OF_WEEK) == Calendar.MONDAY) {
                count++
            }
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        count
    }

    val currentFund = 550000.0 // Base disponible actual
    val projectedDadContribution = mondaysCount * 35000.0
    val totalProjectedCapital = currentFund + projectedDadContribution
    val tripCostTarget = 585451.0
    val projectedSurplus = totalProjectedCapital - tripCostTarget

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("medellin_october_projection_banner"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.2.dp, NuPurple.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
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
                        shape = RectangleShape,
                        color = NuPurple.copy(alpha = 0.2f),
                        modifier = Modifier.size(34.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(text = "✈️", fontSize = 16.sp)
                        }
                    }
                    Column {
                        Text(
                            text = "Capital Proyectado para Medellín",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Fecha meta: Octubre 2026",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }

                Surface(
                    shape = RectangleShape,
                    color = NuPurple.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = "147% META",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = HighDensityLavender,
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                        fontSize = 10.sp
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text(
                        text = "Capital Estimado al Viajar:",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary
                    )
                    Text(
                        text = CurrencyUtils.formatCOP(totalProjectedCapital),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = HighDensityLavender
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Excedente Libre Estimado:",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary
                    )
                    Text(
                        text = "+${CurrencyUtils.formatCOP(projectedSurplus)}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = EmeraldGreen
                    )
                }
            }

            Surface(
                shape = RectangleShape,
                color = DarkSurfaceInner,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Base actual: ${CurrencyUtils.formatCompactCOP(currentFund)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        fontSize = 10.5.sp
                    )
                    Text(
                        text = "•",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary
                    )
                    Text(
                        text = "$mondaysCount lunes ($35k): +${CurrencyUtils.formatCompactCOP(projectedDadContribution)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = CashGold,
                        fontSize = 10.5.sp
                    )
                    Text(
                        text = "•",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary
                    )
                    Text(
                        text = "Meta: ${CurrencyUtils.formatCompactCOP(tripCostTarget)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary,
                        fontSize = 10.5.sp
                    )
                }
            }
        }
    }
}
