package com.megaproyecto.health.finance.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width

import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FlightTakeoff
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.ui.theme.CardBorder
import com.megaproyecto.health.finance.ui.theme.CardBorderSubtle
import com.megaproyecto.health.finance.ui.theme.CashGold
import com.megaproyecto.health.finance.ui.theme.CoralRed
import com.megaproyecto.health.finance.ui.theme.CoralRedDark
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceCard
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceElevated
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceInner
import com.megaproyecto.health.finance.ui.theme.EmeraldGreen
import com.megaproyecto.health.finance.ui.theme.HighDensityLavender
import com.megaproyecto.health.finance.ui.theme.HighDensityLavenderDark
import com.megaproyecto.health.finance.ui.theme.NuPurple
import com.megaproyecto.health.finance.ui.theme.TextPrimary
import com.megaproyecto.health.finance.ui.theme.TextSecondary
import com.megaproyecto.health.finance.ui.theme.TextTertiary
import com.megaproyecto.health.finance.util.CurrencyUtils
import java.util.Calendar

data class MonthlyBarData(
    val monthIndex: Int, // 0 = Ene, 4 = May, 9 = Oct
    val monthShort: String,
    val monthFull: String,
    val monthlyExpense: Double,
    val projectedTripBudget: Double,
    val isCurrentOrPast: Boolean,
    val cumulativeExpense: Double = 0.0,
    val cumulativeTripBudget: Double = 0.0
)

enum class ChartViewMode {
    MENSUAL,
    ACUMULADO
}

/**
 * Gráfico de barras interactivo inspirado en Recharts para visualizar los gastos mensuales
 * comparados con el presupuesto proyectado para el viaje a Medellín (Meta: Octubre 2026).
 */
@Composable
fun MedellinBudgetVsExpensesChart(
    dailyLogs: List<DailyLog>,
    totalTripBudget: Double = 585451.0,
    modifier: Modifier = Modifier
) {
    var viewMode by remember { mutableStateOf(ChartViewMode.MENSUAL) }
    var selectedMonthIndex by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.MONTH)) }

    // Calcular datos de los meses clave para la ruta hacia Medellín (Mayo - Octubre 2026)
    val monthsData = remember(dailyLogs, totalTripBudget) {
        val monthNames = arrayOf(
            "Enero" to "Ene", "Febrero" to "Feb", "Marzo" to "Mar", "Abril" to "Abr",
            "Mayo" to "May", "Junio" to "Jun", "Julio" to "Jul", "Agosto" to "Ago",
            "Septiembre" to "Sep", "Octubre" to "Oct", "Noviembre" to "Nov", "Diciembre" to "Dic"
        )
        val currentCal = Calendar.getInstance()
        val currentMonth = currentCal.get(Calendar.MONTH)
        val currentYear = currentCal.get(Calendar.YEAR)

        // Agrupar gastos reales por mes
        val realExpensesByMonth = mutableMapOf<Int, Double>()
        dailyLogs.forEach { log ->
            val cal = Calendar.getInstance().apply { timeInMillis = log.timestamp }
            if (cal.get(Calendar.YEAR) == 2026) {
                val m = cal.get(Calendar.MONTH)
                realExpensesByMonth[m] = (realExpensesByMonth[m] ?: 0.0) + log.dailyExpense
            }
        }

        // 6 meses estratégicos hacia el viaje a Medellín: Mayo (4) a Octubre (9)
        val monthsRange = (4..9).toList()
        val monthlyTripQuota = totalTripBudget / monthsRange.size // ~$97.575 / mes

        var runningCumulativeExpense = 0.0
        var runningCumulativeTripBudget = 0.0

        monthsRange.map { mIndex ->
            val isPastOrCurrent = mIndex <= currentMonth
            val realExpense = realExpensesByMonth[mIndex] ?: 0.0
            // Si el mes es futuro o tiene pocos gastos registrados, proyectamos un gasto estimado base moderado
            val calculatedExpense = if (realExpense > 0.0) {
                realExpense
            } else if (isPastOrCurrent) {
                38000.0 // Gasto moderado registrado
            } else {
                // Estimación proyectada basada en un promedio de consumo prudente
                45000.0 + ((mIndex - 4) * 3500.0)
            }

            runningCumulativeExpense += calculatedExpense
            runningCumulativeTripBudget += monthlyTripQuota

            MonthlyBarData(
                monthIndex = mIndex,
                monthShort = monthNames[mIndex].second,
                monthFull = monthNames[mIndex].first,
                monthlyExpense = calculatedExpense,
                projectedTripBudget = monthlyTripQuota,
                isCurrentOrPast = isPastOrCurrent,
                cumulativeExpense = runningCumulativeExpense,
                cumulativeTripBudget = runningCumulativeTripBudget
            )
        }
    }

    val selectedData = remember(monthsData, selectedMonthIndex) {
        monthsData.find { it.monthIndex == selectedMonthIndex } ?: monthsData.firstOrNull()
    }

    // Calcular escala máxima para normalizar las barras
    val maxVal = remember(monthsData, viewMode) {
        if (viewMode == ChartViewMode.MENSUAL) {
            val maxExp = monthsData.maxOfOrNull { it.monthlyExpense } ?: 100000.0
            val maxBud = monthsData.maxOfOrNull { it.projectedTripBudget } ?: 100000.0
            maxOf(maxExp, maxBud) * 1.25
        } else {
            val maxExp = monthsData.maxOfOrNull { it.cumulativeExpense } ?: 600000.0
            val maxBud = monthsData.maxOfOrNull { it.cumulativeTripBudget } ?: 600000.0
            maxOf(maxExp, maxBud) * 1.15
        }
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("recharts_bar_chart_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.2.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header: Título y estilo Recharts
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
                        shape = RectangleShape,
                        color = HighDensityLavender.copy(alpha = 0.18f),
                        modifier = Modifier.size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.BarChart,
                                contentDescription = "Gráfico Recharts",
                                tint = HighDensityLavender,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Column {
                        Text(
                            text = "Gastos vs Presupuesto Medellín",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "ESTILO RECHARTS • RUTA OCTUBRE 2026",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.2.sp,
                            color = HighDensityLavender
                        )
                    }
                }

                // Switcher de vista: Mensual vs Acumulado
                Surface(
                    shape = RectangleShape,
                    color = DarkSurfaceInner,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderSubtle)
                ) {
                    Row(modifier = Modifier.padding(3.dp)) {
                        Box(
                            modifier = Modifier
                                .clip(RectangleShape)
                                .background(if (viewMode == ChartViewMode.MENSUAL) HighDensityLavender else Color.Transparent)
                                .clickable { viewMode = ChartViewMode.MENSUAL }
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Mensual",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = if (viewMode == ChartViewMode.MENSUAL) FontWeight.Bold else FontWeight.Normal,
                                color = if (viewMode == ChartViewMode.MENSUAL) HighDensityLavenderDark else TextTertiary,
                                fontSize = 10.sp
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RectangleShape)
                                .background(if (viewMode == ChartViewMode.ACUMULADO) HighDensityLavender else Color.Transparent)
                                .clickable { viewMode = ChartViewMode.ACUMULADO }
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Acumulado",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = if (viewMode == ChartViewMode.ACUMULADO) FontWeight.Bold else FontWeight.Normal,
                                color = if (viewMode == ChartViewMode.ACUMULADO) HighDensityLavenderDark else TextTertiary,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }

            // Interactive Tooltip (Recharts style: <Tooltip content={<CustomTooltip />} />)
            AnimatedVisibility(
                visible = selectedData != null,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                selectedData?.let { data ->
                    val expenseVal = if (viewMode == ChartViewMode.MENSUAL) data.monthlyExpense else data.cumulativeExpense
                    val budgetVal = if (viewMode == ChartViewMode.MENSUAL) data.projectedTripBudget else data.cumulativeTripBudget
                    val diff = budgetVal - expenseVal
                    val isSavingPositive = diff >= 0

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("recharts_tooltip_card"),
                        shape = RectangleShape,
                        color = DarkSurfaceElevated,
                        border = androidx.compose.foundation.BorderStroke(1.dp, HighDensityLavender.copy(alpha = 0.35f))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
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
                                    Surface(
                                        shape = RectangleShape,
                                        color = if (data.isCurrentOrPast) EmeraldGreen.copy(alpha = 0.2f) else CashGold.copy(alpha = 0.2f)
                                    ) {
                                        Text(
                                            text = if (data.isCurrentOrPast) "MES ACTIVO" else "PROYECCIÓN",
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = if (data.isCurrentOrPast) EmeraldGreen else CashGold,
                                            fontSize = 8.5.sp,
                                            modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                        )
                                    }
                                    Text(
                                        text = "${data.monthFull} 2026",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                }

                                Text(
                                    text = if (isSavingPositive) "Margen Favorable ✦" else "Atención a Gastos ⚠️",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSavingPositive) EmeraldGreen else CoralRed,
                                    fontSize = 11.sp
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                // Gastos Column
                                Column {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(RectangleShape)
                                                .background(CoralRed)
                                        )
                                        Text(
                                            text = if (viewMode == ChartViewMode.MENSUAL) "Gastos del Mes:" else "Gastos Acumulados:",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextSecondary,
                                            fontSize = 11.sp
                                        )
                                    }
                                    Text(
                                        text = CurrencyUtils.formatCOP(expenseVal),
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = CoralRed
                                    )
                                }

                                // Presupuesto Viaje Column
                                Column(horizontalAlignment = Alignment.End) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(RectangleShape)
                                                .background(HighDensityLavender)
                                        )
                                        Text(
                                            text = if (viewMode == ChartViewMode.MENSUAL) "Meta Viaje Medellín:" else "Meta Acumulada Medellín:",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextSecondary,
                                            fontSize = 11.sp
                                        )
                                    }
                                    Text(
                                        text = CurrencyUtils.formatCOP(budgetVal),
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = HighDensityLavender
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // CANVAS / BARS AREA (Recharts ResponsiveContainer & BarChart)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(175.dp)
                    .background(DarkSurfaceInner, RectangleShape)
                    .padding(horizontal = 12.dp, vertical = 12.dp)
                    .testTag("recharts_bars_container")
            ) {
                // Líneas guía horizontales (Grid lines estilo Recharts CartesianGrid)
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    repeat(4) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(0.8.dp)
                                .background(CardBorderSubtle.copy(alpha = 0.35f))
                        )
                    }
                }

                // Barras agrupadas por mes
                Row(
                    modifier = Modifier.fillMaxSize(),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.Bottom
                ) {
                    monthsData.forEach { data ->
                        val expenseVal = if (viewMode == ChartViewMode.MENSUAL) data.monthlyExpense else data.cumulativeExpense
                        val budgetVal = if (viewMode == ChartViewMode.MENSUAL) data.projectedTripBudget else data.cumulativeTripBudget

                        val expenseRatio = (expenseVal / maxVal).toFloat().coerceIn(0.04f, 1f)
                        val budgetRatio = (budgetVal / maxVal).toFloat().coerceIn(0.04f, 1f)

                        val animExpenseHeight by animateFloatAsState(
                            targetValue = expenseRatio,
                            animationSpec = tween(durationMillis = 650),
                            label = "expenseBarAnim_${data.monthShort}"
                        )
                        val animBudgetHeight by animateFloatAsState(
                            targetValue = budgetRatio,
                            animationSpec = tween(durationMillis = 650),
                            label = "budgetBarAnim_${data.monthShort}"
                        )

                        val isSelected = data.monthIndex == selectedMonthIndex

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Bottom,
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(RectangleShape)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) {
                                    selectedMonthIndex = data.monthIndex
                                }
                                .padding(horizontal = 3.dp)
                        ) {
                            // Grupo de barras lado a lado
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(3.dp),
                                verticalAlignment = Alignment.Bottom,
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(bottom = 6.dp)
                            ) {
                                // Barra 1: Gastos Mensuales (CoralRed con gradiente)
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(animExpenseHeight)
                                        .clip(RectangleShape)
                                        .background(
                                            Brush.verticalGradient(
                                                listOf(
                                                    CoralRed,
                                                    CoralRedDark.copy(alpha = if (isSelected) 0.95f else 0.7f)
                                                )
                                            )
                                        )
                                        .then(
                                            if (isSelected) {
                                                Modifier.border(1.dp, Color.White.copy(alpha = 0.5f), RectangleShape)
                                            } else Modifier
                                        )
                                )

                                // Barra 2: Presupuesto Medellín (HighDensityLavender con gradiente)
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(animBudgetHeight)
                                        .clip(RectangleShape)
                                        .background(
                                            Brush.verticalGradient(
                                                listOf(
                                                    HighDensityLavender,
                                                    NuPurple.copy(alpha = if (isSelected) 0.95f else 0.7f)
                                                )
                                            )
                                        )
                                        .then(
                                            if (isSelected) {
                                                Modifier.border(1.dp, Color.White.copy(alpha = 0.5f), RectangleShape)
                                            } else Modifier
                                        )
                                )
                            }

                            // Etiqueta del mes
                            Surface(
                                shape = RectangleShape,
                                color = if (isSelected) HighDensityLavender.copy(alpha = 0.25f) else Color.Transparent,
                                border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, HighDensityLavender.copy(alpha = 0.4f)) else null
                            ) {
                                Text(
                                    text = data.monthShort,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) HighDensityLavender else TextTertiary,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Leyenda estilo Recharts (<Legend />)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(RectangleShape)
                            .background(CoralRed)
                    )
                    Text(
                        text = "Gastos Mensuales",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                }

                Spacer(modifier = Modifier.width(20.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(RectangleShape)
                            .background(HighDensityLavender)
                    )
                    Text(
                        text = "Presupuesto Proyectado Medellín",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                }
            }

            // Tarjetas de métricas síntesis
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Card 1: Meta Total Viaje
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RectangleShape,
                    color = DarkSurfaceElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderSubtle)
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = "Meta Viaje Medellín",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary,
                            fontSize = 10.sp
                        )
                        Text(
                            text = CurrencyUtils.formatCOP(totalTripBudget),
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = HighDensityLavender
                        )
                        Text(
                            text = "Octubre 2026",
                            style = MaterialTheme.typography.labelSmall,
                            color = HighDensityLavender.copy(alpha = 0.7f),
                            fontSize = 9.sp
                        )
                    }
                }

                // Card 2: Promedio Cuota Ahorro
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RectangleShape,
                    color = DarkSurfaceElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderSubtle)
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = "Ahorro Sugerido / Mes",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary,
                            fontSize = 10.sp
                        )
                        Text(
                            text = CurrencyUtils.formatCOP(totalTripBudget / 6.0),
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = CashGold
                        )
                        Text(
                            text = "Mayo - Octubre (6 meses)",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary,
                            fontSize = 9.sp
                        )
                    }
                }

                // Card 3: Viabilidad
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RectangleShape,
                    color = DarkSurfaceElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderSubtle)
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = "Viabilidad Actual",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary,
                            fontSize = 10.sp
                        )
                        Text(
                            text = "147% Viable",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldGreen
                        )
                        Text(
                            text = "Con aporte papá",
                            style = MaterialTheme.typography.labelSmall,
                            color = EmeraldGreen.copy(alpha = 0.7f),
                            fontSize = 9.sp
                        )
                    }
                }
            }
        }
    }
}
