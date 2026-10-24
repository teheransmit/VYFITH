package com.megaproyecto.health.finance.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
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
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Subscriptions
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.megaproyecto.health.finance.data.model.AccountBalance
import com.megaproyecto.health.finance.data.model.FixedExpense
import com.megaproyecto.health.finance.ui.components.AddEditExpenseDialog
import com.megaproyecto.health.finance.ui.components.EditAccountDialog
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
import com.megaproyecto.health.finance.ui.theme.NequiPink
import com.megaproyecto.health.finance.ui.theme.NuPurple
import com.megaproyecto.health.finance.ui.theme.TextPrimary
import com.megaproyecto.health.finance.ui.theme.TextSecondary
import com.megaproyecto.health.finance.ui.theme.TextTertiary
import com.megaproyecto.health.finance.util.CurrencyUtils
import com.megaproyecto.health.finance.viewmodel.DashboardUiState

@Composable
fun DashboardScreen(
    state: DashboardUiState,
    onUpdateAccountBalance: (name: String, amount: Double) -> Unit,
    onAddExpense: (title: String, amount: Double, category: String) -> Unit,
    onUpdateExpense: (id: Int, title: String, amount: Double, category: String) -> Unit,
    onDeleteExpense: (id: Int, title: String) -> Unit,
    onConsultGemini: (() -> Unit)? = null,
    userEmail: String? = null,
    onSignOut: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var selectedAccountToEdit by remember { mutableStateOf<AccountBalance?>(null) }
    var selectedExpenseToEdit by remember { mutableStateOf<FixedExpense?>(null) }
    var showAddExpenseDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
            .testTag("dashboard_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
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
                            Text(
                                text = "🪙",
                                fontSize = 20.sp
                            )
                        }
                    }
                    Column {
                        Text(
                            text = "Mis Finanzas",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.testTag("dashboard_title")
                        )
                        Text(
                            text = "⚔️ INVENTARIO RPG",
                            fontSize = 10.sp,
                            letterSpacing = 2.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = HighDensityLavenderSubtle
                        )
                    }
                }

                Surface(
                    shape = RectangleShape,
                    color = DarkSurfaceElevated,
                    border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder)
                ) {
                    Text(
                        text = "Total: ${CurrencyUtils.formatCOP(state.totalBalances)}",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = EmeraldGreen,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }
        }

        // Real-time Firestore Cloud Sync Status Banner
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("firestore_sync_banner"),
                shape = RectangleShape,
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            shape = RectangleShape,
                            color = EmeraldGreen.copy(alpha = 0.18f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldGreen),
                            modifier = Modifier.size(32.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(text = "⚡", fontSize = 16.sp)
                            }
                        }
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = "Firestore en la Nube",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Surface(
                                    shape = RectangleShape,
                                    color = EmeraldGreen.copy(alpha = 0.2f),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldGreen)
                                ) {
                                    Text(
                                        text = "EN TIEMPO REAL",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Black,
                                        color = EmeraldGreen,
                                        fontSize = 8.sp,
                                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Text(
                                text = userEmail ?: "santiagosmitttt@gmail.com",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextTertiary,
                                fontSize = 11.sp
                            )
                        }
                    }

                    if (onSignOut != null) {
                        OutlinedButton(
                            onClick = onSignOut,
                            shape = RectangleShape,
                            border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier
                                .height(32.dp)
                                .testTag("btn_sign_out")
                        ) {
                            Text(
                                text = "Cerrar sesión",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }

        // Section: Saldos Actuales (High Density 3-Column Grid)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 2.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Saldos Actuales",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = HighDensityLavender
                    )
                    Text(
                        text = "Toca para editar",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary
                    )
                }

                // 3-Column Compact Grid
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    state.accounts.forEach { account ->
                        HighDensityAccountCard(
                            account = account,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedAccountToEdit = account }
                        )
                    }
                }
            }
        }

        // Section: Deudas y Gastos Fijos (Retro RPG Dialog Window)
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("fixed_debts_container_card"),
                shape = RectangleShape,
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder)
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
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "🗡️ Deudas y Gastos Fijos",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = HighDensityLavender
                            )
                            Surface(
                                shape = RectangleShape,
                                color = DarkSurfaceElevated,
                                border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderSubtle)
                            ) {
                                Text(
                                    text = "Editables",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = TextSecondary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }

                        IconButton(
                            onClick = { showAddExpenseDialog = true },
                            modifier = Modifier
                                .size(28.dp)
                                .testTag("add_debt_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Agregar deuda o gasto",
                                tint = HighDensityLavender,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }

                    // Items inside container
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        state.fixedExpenses.forEachIndexed { index, expense ->
                            HighDensityFixedExpenseRow(
                                expense = expense,
                                onEditClick = { selectedExpenseToEdit = expense }
                            )
                            if (index < state.fixedExpenses.size - 1) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(1.dp)
                                        .background(CardBorderSubtle.copy(alpha = 0.6f))
                                )
                            }
                        }
                    }

                    // Summary inside card
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Total compromisos",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary
                        )
                        Text(
                            text = "-${CurrencyUtils.formatCOP(state.totalDebtsAndExpenses)}",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = CoralRed
                        )
                    }
                }
            }
        }

        // Section: Excedente Líquido Libre (High Density Hero Card)
        item {
            HighDensityExcedenteCard(
                excedente = state.excedenteLiquidoLibre,
                totalBalances = state.totalBalances,
                totalDebts = state.totalDebtsAndExpenses,
                isPositive = state.isPositiveExcedente
            )
        }

        // Section: Asesor Gemini Shortcut
        if (onConsultGemini != null) {
            item {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onConsultGemini() }
                        .testTag("dashboard_consult_gemini_banner"),
                    shape = RectangleShape,
                    color = DarkSurfaceCard,
                    border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 12.dp),
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
                                color = DarkSurfaceElevated,
                                border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(text = "🔮", fontSize = 16.sp)
                                }
                            }
                            Column {
                                Text(
                                    text = "Oráculo Financiero Gemini",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Consulta el grimorio y previsiones del viaje ✦",
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
    }

    // Dialogs
    selectedAccountToEdit?.let { account ->
        EditAccountDialog(
            account = account,
            onDismiss = { selectedAccountToEdit = null },
            onConfirm = { newAmount ->
                onUpdateAccountBalance(account.name, newAmount)
                selectedAccountToEdit = null
            }
        )
    }

    if (showAddExpenseDialog) {
        AddEditExpenseDialog(
            expense = null,
            onDismiss = { showAddExpenseDialog = false },
            onConfirm = { title, amount, category ->
                onAddExpense(title, amount, category)
                showAddExpenseDialog = false
            }
        )
    }

    selectedExpenseToEdit?.let { expense ->
        AddEditExpenseDialog(
            expense = expense,
            onDismiss = { selectedExpenseToEdit = null },
            onConfirm = { title, amount, category ->
                onUpdateExpense(expense.id, title, amount, category)
                selectedExpenseToEdit = null
            },
            onDelete = {
                onDeleteExpense(expense.id, expense.title)
                selectedExpenseToEdit = null
            }
        )
    }
}

@Composable
fun HighDensityAccountCard(
    account: AccountBalance,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val (shortAmount, subtitle, emoji) = when (account.type) {
        "NU" -> Triple(CurrencyUtils.formatCOP(account.balance), "Cuenta Nu", "🏦")
        "NEQUI" -> Triple(CurrencyUtils.formatCOP(account.balance), "Nequi", "💎")
        else -> Triple(CurrencyUtils.formatCOP(account.balance), "Efectivo", "🪙")
    }

    val brandAccent = when (account.type) {
        "NU" -> HighDensityLavender
        "NEQUI" -> NequiPink
        else -> CashGold
    }

    Surface(
        modifier = modifier
            .clickable(onClick = onClick)
            .testTag("account_card_${account.name.lowercase().replace(" ", "_")}"),
        shape = RectangleShape,
        color = DarkSurfaceCard,
        border = androidx.compose.foundation.BorderStroke(2.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(text = emoji, fontSize = 12.sp)
                    Text(
                        text = subtitle,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextSecondary
                    )
                }
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .background(brandAccent)
                )
            }
            Text(
                text = shortAmount,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = EmeraldGreen,
                maxLines = 1, overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun HighDensityFixedExpenseRow(
    expense: FixedExpense,
    onEditClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onEditClick)
            .padding(vertical = 6.dp, horizontal = 4.dp)
            .testTag("expense_item_${expense.id}"),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(text = "🗡️", fontSize = 14.sp)
            Text(
                text = expense.title, maxLines = 1, overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "-${CurrencyUtils.formatCOP(expense.amount)}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = CoralRed
            )
            Icon(
                imageVector = Icons.Default.Edit,
                contentDescription = "Editar ${expense.title}",
                tint = TextTertiary.copy(alpha = 0.6f),
                modifier = Modifier.size(14.dp)
            )
        }
    }
}

@Composable
fun HighDensityExcedenteCard(
    excedente: Double,
    totalBalances: Double,
    totalDebts: Double,
    isPositive: Boolean
) {
    val statusColor = if (isPositive) EmeraldGreen else CoralRed

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("excedente_liquido_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceInner),
        border = androidx.compose.foundation.BorderStroke(3.dp, if (isPositive) CardBorder else CoralRed)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "🛡️ EXCEDENTE LÍQUIDO LIBRE",
                fontSize = 11.sp,
                letterSpacing = 2.sp,
                fontWeight = FontWeight.Bold,
                color = TextSecondary.copy(alpha = 0.9f)
            )

            // Prominent Amount
            Text(
                text = CurrencyUtils.formatCOP(excedente),
                style = MaterialTheme.typography.headlineLarge.copy(fontSize = 32.sp),
                fontWeight = FontWeight.Bold,
                color = statusColor,
                modifier = Modifier.testTag("excedente_amount_text")
            )

            // Status Pill Badge (Retro SNES HP style)
            Surface(
                shape = RectangleShape,
                color = DarkSurfaceElevated,
                border = androidx.compose.foundation.BorderStroke(2.dp, statusColor)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = if (isPositive) "🛡️" else "💀",
                        fontSize = 14.sp
                    )
                    Text(
                        text = if (isPositive) "MANÁ / BALANCE POSITIVO" else "DEFICIT DESTRUCTIVO",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Calculation formula pill breakdown
            Surface(
                shape = RectangleShape,
                color = DarkSurface.copy(alpha = 0.6f),
                border = androidx.compose.foundation.BorderStroke(2.dp, CardBorderSubtle)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Saldos 🪙", style = MaterialTheme.typography.labelSmall, fontSize = 10.sp, color = TextTertiary)
                        Text(
                            text = CurrencyUtils.formatCOP(totalBalances),
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldGreen
                        )
                    }
                    Text("-", style = MaterialTheme.typography.bodyLarge, color = CoralRed, fontWeight = FontWeight.Bold)
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Deudas 🗡️", style = MaterialTheme.typography.labelSmall, fontSize = 10.sp, color = TextTertiary)
                        Text(
                            text = CurrencyUtils.formatCOP(totalDebts),
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = CoralRed
                        )
                    }
                    Text("=", style = MaterialTheme.typography.bodyLarge, color = TextSecondary, fontWeight = FontWeight.Bold)
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Liquidez 🛡️", style = MaterialTheme.typography.labelSmall, fontSize = 10.sp, color = TextTertiary)
                        Text(
                            text = CurrencyUtils.formatCOP(excedente),
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                }
            }
        }
    }
}
