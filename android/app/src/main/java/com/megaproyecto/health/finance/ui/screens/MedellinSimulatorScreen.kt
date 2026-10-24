package com.megaproyecto.health.finance.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.lazy.items

import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Celebration
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FlightTakeoff
import androidx.compose.material.icons.filled.Hotel
import androidx.compose.material.icons.filled.LocalActivity
import androidx.compose.material.icons.filled.LocalTaxi
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Pets
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.megaproyecto.health.finance.data.model.AccountBalance
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.data.model.TripFixedItem
import com.megaproyecto.health.finance.ui.components.EditDadContributionDialog
import com.megaproyecto.health.finance.ui.components.EditMedellinFundDialog
import com.megaproyecto.health.finance.ui.components.MedellinBudgetVsExpensesChart
import com.megaproyecto.health.finance.ui.components.RegisterDadAbonoDialog
import com.megaproyecto.health.finance.ui.theme.CardBorder
import com.megaproyecto.health.finance.ui.theme.CardBorderSubtle
import com.megaproyecto.health.finance.ui.theme.CashGold
import com.megaproyecto.health.finance.ui.theme.CoralRed
import com.megaproyecto.health.finance.ui.theme.CoralRedDark
import com.megaproyecto.health.finance.ui.theme.DarkBackground
import com.megaproyecto.health.finance.ui.theme.DarkSurface
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceCard
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceElevated
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceInner
import com.megaproyecto.health.finance.ui.theme.EmeraldGreen
import com.megaproyecto.health.finance.ui.theme.EmeraldGreenDark
import com.megaproyecto.health.finance.ui.theme.HighDensityLavender
import com.megaproyecto.health.finance.ui.theme.HighDensityLavenderDark
import com.megaproyecto.health.finance.ui.theme.HighDensityLavenderSubtle
import com.megaproyecto.health.finance.ui.theme.HighlightCyan
import com.megaproyecto.health.finance.ui.theme.NequiPink
import com.megaproyecto.health.finance.ui.theme.NuPurple
import com.megaproyecto.health.finance.ui.theme.TextPrimary
import com.megaproyecto.health.finance.ui.theme.TextSecondary
import com.megaproyecto.health.finance.ui.theme.TextTertiary
import com.megaproyecto.health.finance.util.CurrencyUtils
import com.megaproyecto.health.finance.viewmodel.MedellinSimulatorUiState

@Composable
fun MedellinSimulatorScreen(
    state: MedellinSimulatorUiState,
    excedenteLiquidoActual: Double,
    accounts: List<AccountBalance> = emptyList(),
    dailyLogs: List<DailyLog> = emptyList(),
    onUpdateFund: (Double) -> Unit,
    onSyncWithExcedente: (Double) -> Unit,
    onUpdateDadContribution: (totalCommitted: Double, paidAmount: Double) -> Unit = { _, _ -> },
    onRegisterDadAbono: (amount: Double, targetAccount: String?) -> Unit = { _, _ -> },
    onConsultGemini: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var showEditFundDialog by remember { mutableStateOf(false) }
    var showEditDadDialog by remember { mutableStateOf(false) }
    var showRegisterDadAbonoDialog by remember { mutableStateOf(false) }

    val animatedProgress by animateFloatAsState(
        targetValue = state.coveragePercent.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 800),
        label = "tripProgressAnimation"
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
            .testTag("medellin_simulator_screen"),
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
                            Text(text = "🏰", fontSize = 22.sp)
                        }
                    }
                    Column {
                        Text(
                            text = "Simulador Medellín",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.testTag("medellin_simulator_title")
                        )
                        Text(
                            text = "🏰 MISIÓN MEDELLÍN RPG",
                            fontSize = 10.sp,
                            letterSpacing = 2.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = HighDensityLavenderSubtle
                        )
                    }
                }
            }
        }

        // Dad's Contribution Hero Card (New Key Feature)
        item {
            DadContributionHeroCard(
                state = state,
                onEditClick = { showEditDadDialog = true },
                onRegisterAbonoClick = { showRegisterDadAbonoDialog = true }
            )
        }

        // Top Progress & Comparison Hero Card
        item {
            TripProgressHeroCard(
                state = state,
                animatedProgress = animatedProgress,
                onEditFundClick = { showEditFundDialog = true }
            )
        }

        // Gráfico Recharts de Barras: Gastos Mensuales vs Presupuesto Medellín
        item {
            MedellinBudgetVsExpensesChart(
                dailyLogs = dailyLogs,
                totalTripBudget = state.totalEstimatedCost
            )
        }

        // Quick AI Viability Check Banner
        if (onConsultGemini != null) {
            item {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RectangleShape)
                        .clickable { onConsultGemini() }
                        .testTag("medellin_consult_gemini_banner"),
                    shape = RectangleShape,
                    color = DarkSurfaceElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, HighDensityLavender.copy(alpha = 0.4f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                modifier = Modifier.size(32.dp),
                                shape = RectangleShape,
                                color = HighDensityLavender.copy(alpha = 0.15f)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = null,
                                        tint = HighDensityLavender,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            Column {
                                Text(
                                    text = "¿Voy bien o mal para el viaje?",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Diagnóstico inteligente con Gemini IA ✦",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = HighDensityLavenderSubtle,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            tint = HighDensityLavender,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        // Action Button: Sincronizar con Excedente Líquido
        item {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RectangleShape)
                    .clickable {
                        if (excedenteLiquidoActual > 0) {
                            onSyncWithExcedente(excedenteLiquidoActual)
                        }
                    },
                shape = RectangleShape,
                color = DarkSurfaceCard,
                border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Sync,
                            contentDescription = null,
                            tint = HighDensityLavender,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Sincronizar fondo con mi Excedente Libre",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                            color = TextSecondary
                        )
                    }
                    Text(
                        text = CurrencyUtils.formatCOP(excedenteLiquidoActual),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = HighDensityLavender
                    )
                }
            }
        }

        // Section: Rubros Fijos del Viaje
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Rubros Fijos del Viaje",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = HighDensityLavender
                    )
                    Text(
                        text = "Costos presupuestados fijos",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextTertiary
                    )
                }

                Surface(
                    shape = RectangleShape,
                    color = DarkSurfaceElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = TextTertiary,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Total: ${CurrencyUtils.formatCOP(state.totalEstimatedCost)}",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = TextSecondary
                        )
                    }
                }
            }
        }

        // Lazy items of fixed trip expenses
        items(state.tripItems, key = { it.id }) { tripItem ->
            TripItemCard(
                item = tripItem,
                totalCost = state.totalEstimatedCost
            )
        }

        // Dynamic Final Card: "Balance para Lujos"
        item {
            BalanceParaLujosCard(state = state)
        }
    }

    if (showEditFundDialog) {
        EditMedellinFundDialog(
            currentFund = state.availableFund,
            excedenteLiquido = excedenteLiquidoActual,
            onDismiss = { showEditFundDialog = false },
            onConfirm = { newFund ->
                onUpdateFund(newFund)
                showEditFundDialog = false
            }
        )
    }

    if (showEditDadDialog) {
        EditDadContributionDialog(
            currentCommitted = state.dadTotalCommitted,
            currentPaid = state.dadPaidAmount,
            onDismiss = { showEditDadDialog = false },
            onConfirm = { totalCommitted, paidAmount ->
                onUpdateDadContribution(totalCommitted, paidAmount)
                showEditDadDialog = false
            }
        )
    }

    if (showRegisterDadAbonoDialog) {
        RegisterDadAbonoDialog(
            pendingAmount = state.dadPendingAmount,
            accounts = accounts,
            onDismiss = { showRegisterDadAbonoDialog = false },
            onConfirm = { amount, targetAccount ->
                onRegisterDadAbono(amount, targetAccount)
                showRegisterDadAbonoDialog = false
            }
        )
    }
}

@Composable
fun DadContributionHeroCard(
    state: MedellinSimulatorUiState,
    onEditClick: () -> Unit,
    onRegisterAbonoClick: () -> Unit
) {
    val dadProgress = state.dadProgressPercent
    val isDadFullyPaid = state.dadPendingAmount <= 0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("dad_contribution_hero_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, NequiPink.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header with edit button
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
                        modifier = Modifier.size(38.dp),
                        shape = RectangleShape,
                        color = NequiPink.copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, NequiPink.copy(alpha = 0.3f))
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = NequiPink,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Column {
                        Text(
                            text = "Abono de mi Papá",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Aporte comprometido para el viaje",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }

                IconButton(
                    onClick = onEditClick,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Editar compromiso de papá",
                        tint = HighDensityLavender,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            // Stats summary: Recibido vs Comprometido
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text(
                        text = "Ya Abonado / Recibido",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = CurrencyUtils.formatCOP(state.dadPaidAmount),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Black,
                        color = EmeraldGreen
                    )
                    Text(
                        text = "de ${CurrencyUtils.formatCOP(state.dadTotalCommitted)} pactados",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary,
                        fontSize = 10.sp
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Falta por Abonar",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = CurrencyUtils.formatCOP(state.dadPendingAmount),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (isDadFullyPaid) EmeraldGreen else HighDensityLavender
                    )
                    Text(
                        text = if (isDadFullyPaid) "¡100% recibido!" else "${(dadProgress * 100).toInt()}% recibido",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (isDadFullyPaid) EmeraldGreen else NequiPink,
                        fontSize = 10.sp
                    )
                }
            }

            // Progress bar
            LinearProgressIndicator(
                progress = { dadProgress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RectangleShape),
                color = EmeraldGreen,
                trackColor = DarkSurfaceElevated,
                strokeCap = StrokeCap.Round
            )

            // Real Forecast & Impact Card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RectangleShape,
                color = DarkSurfaceInner,
                border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
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
                        Text(
                            text = "🎯 Tu Meta Personal Real:",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = HighDensityLavender
                        )
                        Text(
                            text = CurrencyUtils.formatCOP(state.personalRemainingTarget),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = HighDensityLavender
                        )
                    }

                    Text(
                        text = "De la meta total (${CurrencyUtils.formatCOP(state.totalEstimatedCost)}), tu papá cubrirá ${CurrencyUtils.formatCOP(state.dadTotalCommitted)}. Solo necesitas poner ${CurrencyUtils.formatCOP(state.personalRemainingTarget)} con tus paseos o Rappi.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        lineHeight = 17.sp,
                        fontSize = 11.sp
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    val siennaWalksNeeded = kotlin.math.ceil(state.personalRemainingTarget / 9000.0).toInt().coerceAtLeast(0)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Pets,
                                contentDescription = null,
                                tint = EmeraldGreen,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Equivale a ~$siennaWalksNeeded paseos Sienna",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldGreen
                            )
                        }

                        Text(
                            text = "Pronóstico: ${if (state.isProjectedSurplusWithDad) "Superávit +${CurrencyUtils.formatCOP(state.projectedDeficitOrSurplusWithDad)}" else "Déficit ${CurrencyUtils.formatCOP(state.projectedDeficitOrSurplusWithDad)}"}",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (state.isProjectedSurplusWithDad) EmeraldGreen else CoralRed
                        )
                    }
                }
            }

            // Quick Register Action Button
            Button(
                onClick = onRegisterAbonoClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("register_dad_abono_button"),
                shape = RectangleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = NequiPink,
                    contentColor = Color.White
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Registrar Nuevo Abono de Papá",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }
        }
    }
}

@Composable
fun TripProgressHeroCard(
    state: MedellinSimulatorUiState,
    animatedProgress: Float,
    onEditFundClick: () -> Unit
) {
    val percentInt = (state.availableFund / state.totalEstimatedCost * 100).toInt()
    val isGoalAchieved = state.availableFund >= state.totalEstimatedCost

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("trip_progress_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // RPG Quest Headline Stats & Castle Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "🏰 Meta de Presupuesto",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }
                    Text(
                        text = if (isGoalAchieved) "¡100% cubierto para viajar a Medellín!" else "Progreso de ahorro acumulado",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (isGoalAchieved) EmeraldGreen else TextSecondary
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Surface(
                        shape = RectangleShape,
                        color = if (isGoalAchieved) EmeraldGreen.copy(alpha = 0.2f) else DarkSurfaceElevated,
                        border = androidx.compose.foundation.BorderStroke(
                            2.dp,
                            if (isGoalAchieved) EmeraldGreen else CardBorder
                        )
                    ) {
                        Text(
                            text = "$percentInt% COBERTURA",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isGoalAchieved) EmeraldGreen else HighDensityLavender,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }

                // Retro Castle Badge
                Surface(
                    modifier = Modifier.size(56.dp),
                    shape = RectangleShape,
                    color = DarkSurfaceElevated,
                    border = androidx.compose.foundation.BorderStroke(2.dp, if (isGoalAchieved) EmeraldGreen else CardBorder)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = if (isGoalAchieved) "🏆" else "🏰",
                            fontSize = 28.sp
                        )
                    }
                }
            }

            // Retro 16-bit RPG HP / EXP Progress Bar
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "⚔️ HP / EXP VIAJE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = HighDensityLavenderSubtle
                    )
                    Text(
                        text = "$percentInt% / 100%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isGoalAchieved) EmeraldGreen else TextPrimary
                    )
                }
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(16.dp),
                    shape = RectangleShape,
                    color = DarkBackground,
                    border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder)
                ) {
                    LinearProgressIndicator(
                        progress = { animatedProgress },
                        modifier = Modifier.fillMaxSize(),
                        color = if (isGoalAchieved) EmeraldGreen else HighDensityLavender,
                        trackColor = DarkSurfaceElevated,
                        strokeCap = StrokeCap.Square
                    )
                }
            }

            // Side-by-side comparison: Fondo Disponible vs Costo Total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Fondo Disponible (Editable)
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RectangleShape)
                        .clickable(onClick = onEditFundClick)
                        .testTag("fondo_disponible_card"),
                    shape = RectangleShape,
                    color = DarkSurfaceInner,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Fondo Disponible",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextSecondary
                            )
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Editar Fondo",
                                tint = HighDensityLavender,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = CurrencyUtils.formatCOP(state.availableFund),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = HighDensityLavender,
                            modifier = Modifier.testTag("fondo_disponible_amount")
                        )
                        Text(
                            text = "Toca para editar",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary,
                            fontSize = 10.sp
                        )
                    }
                }

                // Costo Total Estimado (Fijo $584,549)
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RectangleShape)
                        .testTag("costo_total_card"),
                    shape = RectangleShape,
                    color = DarkSurfaceInner,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Costo Estimado",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextSecondary
                            )
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "Fijo",
                                tint = TextTertiary,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = CurrencyUtils.formatCOP(state.totalEstimatedCost),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary,
                            modifier = Modifier.testTag("costo_total_amount")
                        )
                        Text(
                            text = "Fijo en rubros",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary,
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TripItemCard(
    item: TripFixedItem,
    totalCost: Double
) {
    val (icon, color) = when (item.category) {
        "HOTEL" -> Pair(Icons.Default.Hotel, NuPurple)
        "TRANSIT" -> Pair(Icons.Default.DirectionsBus, HighlightCyan)
        "FOOD" -> Pair(Icons.Default.Restaurant, CashGold)
        "TAXI" -> Pair(Icons.Default.LocalTaxi, HighlightCyan)
        "ACTIVITIES" -> Pair(Icons.Default.LocalActivity, EmeraldGreen)
        else -> Pair(Icons.Default.Security, CoralRed)
    }

    val percentage = if (totalCost > 0) ((item.amount / totalCost) * 100).toInt() else 0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("trip_item_${item.id}"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(36.dp),
                    shape = RectangleShape,
                    color = color.copy(alpha = 0.15f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.3f))
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = icon,
                            contentDescription = item.title,
                            tint = color,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    Text(
                        text = "$percentage% del costo total",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary
                    )
                }
            }

            Text(
                text = CurrencyUtils.formatCOP(item.amount),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }
    }
}

@Composable
fun BalanceParaLujosCard(state: MedellinSimulatorUiState) {
    val isDeficit = state.isDeficit
    val accentColor = if (isDeficit) CoralRed else EmeraldGreen

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("balance_para_lujos_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isDeficit) Icons.Default.Warning else Icons.Default.Celebration,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Balance para Lujos",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = HighDensityLavender
                    )
                }

                Surface(
                    shape = RectangleShape,
                    color = if (isDeficit) CoralRed.copy(alpha = 0.2f) else EmeraldGreen.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = if (isDeficit) "Déficit" else "Disponible",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (isDeficit) CoralRed else EmeraldGreen,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            // Amount Display
            Text(
                text = if (isDeficit) {
                    "-${CurrencyUtils.formatCOP(state.deficitAmount)}"
                } else {
                    "+${CurrencyUtils.formatCOP(state.surplusAmount)}"
                },
                style = MaterialTheme.typography.headlineLarge.copy(fontSize = 30.sp),
                fontWeight = FontWeight.Black,
                color = accentColor,
                modifier = Modifier.testTag("balance_para_lujos_amount")
            )

            // Explanatory Text / Alert
            if (isDeficit) {
                Surface(
                    shape = RectangleShape,
                    color = DarkSurfaceInner,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "⚠️ Alerta de Déficit Presupuestal",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = CoralRed,
                            modifier = Modifier.testTag("deficit_alert_header")
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Faltan ${CurrencyUtils.formatCOP(state.deficitAmount)} para poder cubrir la totalidad de los gastos básicos del viaje a Medellín ($584,549).",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextPrimary,
                            modifier = Modifier.testTag("deficit_alert_text")
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        val siennaWalksNeeded = kotlin.math.ceil(state.deficitAmount / 9000.0).toInt()
                        Text(
                            text = "💡 Sugerencia: Cubres este déficit con ~$siennaWalksNeeded paseos de Sienna o 1 turno Rappi.",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary
                        )
                    }
                }
            } else {
                Surface(
                    shape = RectangleShape,
                    color = DarkSurfaceInner,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "🎉 ¡Presupuesto Básico Superado!",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldGreen
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Tienes ${CurrencyUtils.formatCOP(state.surplusAmount)} libres para restaurantes de lujo, compras, vida nocturna o souvenirs en Medellín.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextPrimary
                        )
                    }
                }
            }
        }
    }
}

