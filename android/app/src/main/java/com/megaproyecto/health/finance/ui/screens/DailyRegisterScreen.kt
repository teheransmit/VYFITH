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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DeliveryDining
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Pets
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FabPosition
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.data.model.PendingDebt
import com.megaproyecto.health.finance.ui.components.AddPendingDebtDialog
import com.megaproyecto.health.finance.ui.components.SettleDebtDialog
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
import com.megaproyecto.health.finance.ui.theme.EmeraldGreenLight
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
import com.megaproyecto.health.finance.viewmodel.DailyRegisterUiState

@Composable
fun DailyRegisterScreen(
    state: DailyRegisterUiState,
    dailyLogs: List<DailyLog>,
    pendingDebts: List<PendingDebt> = emptyList(),
    pendingWalksWeekly: Double = 0.0,
    onSettleWeeklyWalks: (targetAccount: String) -> Unit = {},
    onToggleSienna: () -> Unit,
    onToggleFrida: () -> Unit,
    onUpdateRappi: (String) -> Unit,
    onAddQuickRappi: (Double) -> Unit,
    onUpdateExpense: (String) -> Unit,
    onUpdateNote: (String) -> Unit,
    onSelectAccount: (String) -> Unit,
    onSaveDay: () -> Unit,
    onDeleteLog: (Int) -> Unit,
    onAddPendingDebt: (debtorName: String, amount: Double, description: String) -> Unit = { _, _, _ -> },
    onSettlePendingDebt: (debt: PendingDebt, targetAccount: String) -> Unit = { _, _ -> },
    onDeletePendingDebt: (debt: PendingDebt) -> Unit = {},
    modifier: Modifier = Modifier
) {
    var showAddDebtDialog by remember { mutableStateOf(false) }
    var debtToSettle by remember { mutableStateOf<PendingDebt?>(null) }
    var showSettleWalksDialog by remember { mutableStateOf(false) }

    if (showAddDebtDialog) {
        AddPendingDebtDialog(
            onDismiss = { showAddDebtDialog = false },
            onConfirm = { name, amount, description ->
                onAddPendingDebt(name, amount, description)
                showAddDebtDialog = false
            }
        )
    }

    if (showSettleWalksDialog) {
        SettleWeeklyWalksDialog(
            amount = pendingWalksWeekly,
            onDismiss = { showSettleWalksDialog = false },
            onConfirm = { targetAccount ->
                onSettleWeeklyWalks(targetAccount)
                showSettleWalksDialog = false
            }
        )
    }

    debtToSettle?.let { debt ->
        SettleDebtDialog(
            debt = debt,
            onDismiss = { debtToSettle = null },
            onConfirm = { targetAccount ->
                onSettlePendingDebt(debt, targetAccount)
                debtToSettle = null
            }
        )
    }

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground),
        containerColor = DarkBackground,
        floatingActionButtonPosition = FabPosition.End,
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onSaveDay,
                containerColor = HighDensityLavender,
                contentColor = HighDensityLavenderDark,
                shape = RectangleShape,
                modifier = Modifier
                    .padding(bottom = 80.dp)
                    .border(2.dp, CardBorder, RectangleShape)
                    .testTag("fab_guardar_dia"),
                icon = {
                    Text(text = "📜", fontSize = 18.sp)
                },
                text = {
                    Text(
                        text = "GUARDAR DÍA",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("daily_register_screen"),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 120.dp),
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
                                Text(text = "📜", fontSize = 22.sp)
                            }
                        }
                        Column {
                            Text(
                                text = "Registro Diario",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                modifier = Modifier.testTag("daily_register_title")
                            )
                            Text(
                                text = "📜 BITÁCORA DIARIA RPG",
                                fontSize = 10.sp,
                                letterSpacing = 2.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = HighDensityLavenderSubtle
                            )
                        }
                    }
                }
            }

            // Live Daily Summary Preview Banner
            item {
                DailyLiveSummaryCard(state = state)
            }

            // Section 0: Paseos Pendientes de Pago (Semana) - Cuentas por cobrar
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("card_paseos_pendientes_semana"),
                    shape = RectangleShape,
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, HighDensityLavender.copy(alpha = 0.5f))
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
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Surface(
                                    shape = RectangleShape,
                                    color = HighDensityLavender.copy(alpha = 0.2f),
                                    modifier = Modifier.size(38.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(text = "🐾", fontSize = 18.sp)
                                    }
                                }
                                Column {
                                    Text(
                                        text = "Paseos Pendientes de Pago",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "Semana en curso (Cuentas por cobrar)",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary,
                                        fontSize = 11.5.sp
                                    )
                                }
                            }

                            Surface(
                                shape = RectangleShape,
                                color = if (pendingWalksWeekly > 0) EmeraldGreen.copy(alpha = 0.15f) else DarkSurfaceElevated,
                                border = androidx.compose.foundation.BorderStroke(1.dp, if (pendingWalksWeekly > 0) EmeraldGreen.copy(alpha = 0.4f) else CardBorderSubtle)
                            ) {
                                Text(
                                    text = if (pendingWalksWeekly > 0) "Por cobrar" else "Al día",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = if (pendingWalksWeekly > 0) EmeraldGreen else TextTertiary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    fontSize = 10.5.sp
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
                                    text = "Total Acumulado Semana:",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextTertiary
                                )
                                Text(
                                    text = CurrencyUtils.formatCOP(pendingWalksWeekly),
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Black,
                                    color = if (pendingWalksWeekly > 0) HighDensityLavender else TextSecondary
                                )
                            }

                            Text(
                                text = "Sienna • Frida",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextTertiary,
                                fontSize = 10.5.sp
                            )
                        }

                        Text(
                            text = "💡 Al guardar el día, los paseos no se suman a tu balance líquido sino a este fondo pendiente. Al cobrarles a los dueños, usa el botón para ingresarlo a tu liquidez.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary,
                            fontSize = 11.sp,
                            lineHeight = 16.sp
                        )

                        // Botón destacado: "Liquidar Pago Semanal de Paseos"
                        Button(
                            onClick = { showSettleWalksDialog = true },
                            enabled = pendingWalksWeekly > 0,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("btn_liquidar_pago_semanal_paseos"),
                            shape = RectangleShape,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = HighDensityLavender,
                                contentColor = HighDensityLavenderDark,
                                disabledContainerColor = DarkSurfaceElevated,
                                disabledContentColor = TextTertiary
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Liquidar Pago Semanal de Paseos",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Section 1: Ingresos por Paseos
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RectangleShape,
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
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
                                Text(
                                    text = "Ingresos por Paseos",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.SemiBold,
                                    color = HighDensityLavender
                                )
                                Surface(
                                    shape = RectangleShape,
                                    color = DarkSurfaceElevated
                                ) {
                                    Text(
                                        text = "Tarifas",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = TextSecondary,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            if (state.walksTotal > 0) {
                                Text(
                                    text = "+${CurrencyUtils.formatCOP(state.walksTotal)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldGreen
                                )
                            }
                        }

                        // Checkbox items for Sienna and Frida
                        DogWalkCheckboxCard(
                            name = "Sienna",
                            amount = 9000.0,
                            isChecked = state.siennaWalk,
                            onToggle = onToggleSienna,
                            testTag = "walk_sienna_checkbox"
                        )

                        DogWalkCheckboxCard(
                            name = "Frida",
                            amount = 5850.0,
                            isChecked = state.fridaWalk,
                            onToggle = onToggleFrida,
                            testTag = "walk_frida_checkbox"
                        )
                    }
                }
            }

            // Section 2: Turno Rappi
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RectangleShape,
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
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
                            Text(
                                text = "Turno Rappi",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.SemiBold,
                                color = HighDensityLavender
                            )

                            if (state.rappiAmount > 0) {
                                Text(
                                    text = "+${CurrencyUtils.formatCOP(state.rappiAmount)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = CashGold
                                )
                            }
                        }

                        OutlinedTextField(
                            value = state.rappiInput,
                            onValueChange = onUpdateRappi,
                            label = { Text("Ganancias Turno Rappi ($)", fontSize = 12.sp) },
                            placeholder = { Text("Ej. 45000", fontSize = 12.sp) },
                            leadingIcon = {
                                Icon(Icons.Default.AttachMoney, contentDescription = null, tint = CashGold, modifier = Modifier.size(18.dp))
                            },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
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
                                .fillMaxWidth()
                                .testTag("rappi_input_field")
                        )

                        // Quick Add Chips
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            QuickAddChip(label = "+$20k", amount = 20000.0, onClick = onAddQuickRappi)
                            QuickAddChip(label = "+$35k", amount = 35000.0, onClick = onAddQuickRappi)
                            QuickAddChip(label = "+$50k", amount = 50000.0, onClick = onAddQuickRappi)
                        }
                    }
                }
            }

            // Section 3: Gastos del Día
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RectangleShape,
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
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
                            Text(
                                text = "Gastos del Día",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.SemiBold,
                                color = HighDensityLavender
                            )

                            if (state.totalExpense > 0) {
                                Text(
                                    text = "-${CurrencyUtils.formatCOP(state.totalExpense)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = CoralRed
                                )
                            }
                        }

                        OutlinedTextField(
                            value = state.expenseInput,
                            onValueChange = onUpdateExpense,
                            label = { Text("Monto gastado hoy ($)", fontSize = 12.sp) },
                            placeholder = { Text("Ej. 12000", fontSize = 12.sp) },
                            leadingIcon = {
                                Icon(Icons.Default.AttachMoney, contentDescription = null, tint = CoralRed, modifier = Modifier.size(18.dp))
                            },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            shape = RectangleShape,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = CoralRed,
                                unfocusedBorderColor = CardBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedContainerColor = DarkSurfaceInner,
                                unfocusedContainerColor = DarkSurfaceInner
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("daily_expense_input_field")
                        )

                        OutlinedTextField(
                            value = state.expenseNote,
                            onValueChange = onUpdateNote,
                            label = { Text("Concepto o detalle (opcional)", fontSize = 12.sp) },
                            placeholder = { Text("Ej. Pasajes universitarios, almuerzo", fontSize = 12.sp) },
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
                                .fillMaxWidth()
                                .testTag("daily_expense_note_field")
                        )
                    }
                }
            }

            // Section 4: Cuenta destino para el balance
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RectangleShape,
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Cuenta para aplicar el balance:",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = HighDensityLavender
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("Nequi", "Cuenta Nu", "Efectivo").forEach { accountName ->
                                val isSelected = state.selectedTargetAccount == accountName
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { onSelectAccount(accountName) },
                                    label = {
                                        Text(
                                            text = accountName,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                            fontSize = 12.sp
                                        )
                                    },
                                    leadingIcon = if (isSelected) {
                                        {
                                            Icon(
                                                Icons.Default.Check,
                                                contentDescription = null,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    } else null,
                                    shape = RectangleShape,
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = when (accountName) {
                                            "Cuenta Nu" -> NuPurple
                                            "Nequi" -> NequiPink
                                            else -> CashGold
                                        },
                                        selectedLabelColor = Color.White,
                                        containerColor = DarkSurfaceElevated,
                                        labelColor = TextSecondary
                                    ),
                                    modifier = Modifier
                                        .weight(1f)
                                        .testTag("account_chip_${accountName.lowercase().replace(" ", "_")}")
                                    )
                            }
                        }
                    }
                }
            }

            // Section 5: Deudas Pendientes (Gente que me debe plata)
            item {
                Spacer(modifier = Modifier.height(4.dp))
                val totalPendingToCollect = pendingDebts.sumOf { it.amount }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = RectangleShape,
                            color = HighDensityLavender.copy(alpha = 0.15f),
                            modifier = Modifier.size(32.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.People,
                                    contentDescription = null,
                                    tint = HighDensityLavender,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = "Deudas Pendientes",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                if (totalPendingToCollect > 0) {
                                    Surface(
                                        shape = RectangleShape,
                                        color = EmeraldGreen.copy(alpha = 0.18f)
                                    ) {
                                        Text(
                                            text = CurrencyUtils.formatCOP(totalPendingToCollect),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = EmeraldGreen,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                            Text(
                                text = "Gente que te debe dinero por cobrar",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                    }

                    OutlinedButton(
                        onClick = { showAddDebtDialog = true },
                        shape = RectangleShape,
                        border = androidx.compose.foundation.BorderStroke(1.dp, HighDensityLavender),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = HighDensityLavender.copy(alpha = 0.12f)
                        ),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.testTag("add_pending_debt_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = null,
                            tint = HighDensityLavender,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Agregar",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = HighDensityLavender
                        )
                    }
                }
            }

            if (pendingDebts.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("empty_pending_debts_card"),
                        shape = RectangleShape,
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceInner),
                        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorderSubtle)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Surface(
                                shape = RectangleShape,
                                color = DarkSurfaceElevated,
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = EmeraldGreen,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "¡Al día! Nadie te debe dinero actualmente",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Cuando le prestes a alguien, regístralo con '+ Agregar' para cobrarlo luego.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }
                        }
                    }
                }
            } else {
                items(pendingDebts, key = { it.id }) { debt ->
                    PendingDebtItemCard(
                        debt = debt,
                        onSettle = { debtToSettle = debt },
                        onDelete = { onDeletePendingDebt(debt) }
                    )
                }
            }

            // Section 6: Historial de Registros
            if (dailyLogs.isNotEmpty()) {
                item {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.History,
                            contentDescription = null,
                            tint = HighDensityLavender,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Historial Reciente de Días Guardados",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = HighDensityLavender
                        )
                    }
                }

                items(dailyLogs, key = { it.id }) { log ->
                    DailyLogHistoryItem(log = log, onDelete = { onDeleteLog(log.id) })
                }
            }
        }
    }
}

@Composable
fun DogWalkCheckboxCard(
    name: String,
    amount: Double,
    isChecked: Boolean,
    onToggle: () -> Unit,
    testTag: String
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RectangleShape)
            .clickable(onClick = onToggle)
            .testTag(testTag),
        shape = RectangleShape,
        color = if (isChecked) DarkSurfaceElevated else DarkSurfaceInner,
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = if (isChecked) HighDensityLavender else CardBorder
        )
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
                Checkbox(
                    checked = isChecked,
                    onCheckedChange = { onToggle() },
                    colors = CheckboxDefaults.colors(
                        checkedColor = HighDensityLavender,
                        checkmarkColor = HighDensityLavenderDark,
                        uncheckedColor = TextTertiary
                    )
                )
                Column {
                    Text(
                        text = "Paseo $name",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (isChecked) FontWeight.Bold else FontWeight.Medium,
                        color = if (isChecked) TextPrimary else TextSecondary
                    )
                }
            }

            Surface(
                shape = RectangleShape,
                color = if (isChecked) HighDensityLavender.copy(alpha = 0.2f) else DarkSurfaceElevated
            ) {
                Text(
                    text = "+${CurrencyUtils.formatCOP(amount)}",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (isChecked) HighDensityLavender else EmeraldGreen,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

@Composable
fun QuickAddChip(
    label: String,
    amount: Double,
    onClick: (Double) -> Unit
) {
    Surface(
        modifier = Modifier
            .clip(RectangleShape)
            .clickable { onClick(amount) },
        shape = RectangleShape,
        color = DarkSurfaceElevated,
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = HighDensityLavender,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
        )
    }
}

@Composable
fun DailyLiveSummaryCard(state: DailyRegisterUiState) {
    val isNetPositive = state.netDayBalance >= 0
    val netColor = if (isNetPositive) EmeraldGreen else CoralRed

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("daily_live_summary_card"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceInner),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Balance Líquido Inmediato",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextSecondary
                    )
                    Text(
                        text = "Rappi ($) - Gastos ($)",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary,
                        fontSize = 10.5.sp
                    )
                }
                Text(
                    text = if (isNetPositive) "+${CurrencyUtils.formatCOP(state.netDayBalance)}" else CurrencyUtils.formatCOP(state.netDayBalance),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    color = netColor
                )
            }

            if (state.walksTotal > 0) {
                Surface(
                    shape = RectangleShape,
                    color = HighDensityLavender.copy(alpha = 0.12f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, HighDensityLavender.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "🐾 Paseos de hoy: +${CurrencyUtils.formatCOP(state.walksTotal)}",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = HighDensityLavender
                        )
                        Text(
                            text = "Se sumará a Paseos Pendientes",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary,
                            fontSize = 10.sp
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.ArrowUpward,
                        contentDescription = null,
                        tint = EmeraldGreen,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Rappi: ${CurrencyUtils.formatCOP(state.rappiAmount)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = EmeraldGreen
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.ArrowDownward,
                        contentDescription = null,
                        tint = CoralRed,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Gastos: -${CurrencyUtils.formatCOP(state.totalExpense)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = CoralRed
                    )
                }
            }
        }
    }
}

@Composable
fun DailyLogHistoryItem(
    log: DailyLog,
    onDelete: () -> Unit
) {
    val isPositive = log.netChange >= 0
    val netColor = if (isPositive) EmeraldGreen else CoralRed

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("daily_log_item_${log.id}"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = log.dateDisplay,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                val detailsList = mutableListOf<String>()
                if (log.siennaWalk) detailsList.add("Sienna")
                if (log.fridaWalk) detailsList.add("Frida")
                if (log.rappiIncome > 0) detailsList.add("Rappi +${CurrencyUtils.formatCOP(log.rappiIncome)}")
                if (log.dailyExpense > 0) detailsList.add("Gasto -${CurrencyUtils.formatCOP(log.dailyExpense)}")

                Text(
                    text = "${detailsList.joinToString(" • ")} -> ${log.targetAccountName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 2.dp)
                )

                if (log.note.isNotBlank()) {
                    Text(
                        text = "Nota: ${log.note}", maxLines = 1, overflow = TextOverflow.Ellipsis,
                        style = MaterialTheme.typography.labelSmall,
                        color = TextTertiary,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (isPositive) "+${CurrencyUtils.formatCOP(log.netChange)}" else CurrencyUtils.formatCOP(log.netChange),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = netColor
                )
                Spacer(modifier = Modifier.width(6.dp))
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Eliminar registro",
                        tint = TextTertiary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun PendingDebtItemCard(
    debt: PendingDebt,
    onSettle: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("pending_debt_item_${debt.id}"),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Surface(
                        shape = RectangleShape,
                        color = HighDensityLavender.copy(alpha = 0.2f),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = debt.debtorName.take(1).uppercase(),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Black,
                                color = HighDensityLavender
                            )
                        }
                    }

                    Column {
                        Text(
                            text = debt.debtorName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        if (debt.description.isNotBlank()) {
                            Text(
                                text = debt.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                        if (debt.dateCreated.isNotBlank()) {
                            Text(
                                text = debt.dateCreated,
                                style = MaterialTheme.typography.labelSmall,
                                fontSize = 10.sp,
                                color = TextTertiary
                            )
                        }
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = CurrencyUtils.formatCOP(debt.amount),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = EmeraldGreen
                    )
                    Text(
                        text = "Por cobrar",
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 10.sp,
                        color = EmeraldGreen
                    )
                }
            }

            // Actions row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier
                        .size(36.dp)
                        .testTag("delete_debt_button_${debt.id}")
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Eliminar deuda",
                        tint = TextTertiary,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.width(6.dp))

                Button(
                    onClick = onSettle,
                    shape = RectangleShape,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = EmeraldGreen,
                        contentColor = EmeraldGreenDark
                    ),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                    modifier = Modifier.testTag("settle_debt_button_${debt.id}")
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "✓ Me pagó",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun SettleWeeklyWalksDialog(
    amount: Double,
    onDismiss: () -> Unit,
    onConfirm: (targetAccount: String) -> Unit
) {
    var selectedAccount by remember { mutableStateOf("Nequi") }
    val accounts = listOf(
        Triple("Efectivo", EmeraldGreen, Icons.Default.Payments),
        Triple("Cuenta Nu", NuPurple, Icons.Default.CreditCard),
        Triple("Nequi", NequiPink, Icons.Default.AccountBalanceWallet)
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "Liquidar Pago Semanal de Paseos",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = "Monto acumulado: ${CurrencyUtils.formatCOP(amount)}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = HighDensityLavender
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(
                    text = "¿A qué cuenta entró el dinero?",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    accounts.forEach { (accName, color, icon) ->
                        val isSelected = selectedAccount == accName
                        Surface(
                            shape = RectangleShape,
                            color = if (isSelected) color.copy(alpha = 0.18f) else DarkSurfaceInner,
                            border = androidx.compose.foundation.BorderStroke(
                                1.5.dp,
                                if (isSelected) color else CardBorder
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedAccount = accName }
                                .testTag("settle_walks_option_$accName")
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
                                        shape = RectangleShape,
                                        color = color.copy(alpha = 0.25f),
                                        modifier = Modifier.size(34.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(
                                                imageVector = icon,
                                                contentDescription = null,
                                                tint = color,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                    Text(
                                        text = accName,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = TextPrimary
                                    )
                                }

                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = color,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                Text(
                    text = "Al confirmar, los ${CurrencyUtils.formatCOP(amount)} pasarán a ser liquidez real en tu Dashboard y el contador semanal de paseos pendientes vuelve a cero.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextTertiary,
                    fontSize = 11.5.sp
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(selectedAccount) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = HighDensityLavender,
                    contentColor = HighDensityLavenderDark
                ),
                shape = RectangleShape,
                modifier = Modifier.testTag("confirm_settle_walks_button")
            ) {
                Text("Confirmar Liquidación", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        },
        containerColor = DarkSurfaceCard,
        shape = RectangleShape
    )
}

