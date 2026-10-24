package com.megaproyecto.health.finance.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.megaproyecto.health.finance.data.model.AccountBalance
import com.megaproyecto.health.finance.data.model.FixedExpense
import com.megaproyecto.health.finance.data.model.PendingDebt
import com.megaproyecto.health.finance.ui.theme.CardBorder
import com.megaproyecto.health.finance.ui.theme.CashGold
import com.megaproyecto.health.finance.ui.theme.CoralRed
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceCard
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceElevated
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceInner
import com.megaproyecto.health.finance.ui.theme.EmeraldGreen
import com.megaproyecto.health.finance.ui.theme.HighDensityLavender
import com.megaproyecto.health.finance.ui.theme.HighDensityLavenderDark
import com.megaproyecto.health.finance.ui.theme.NequiPink
import com.megaproyecto.health.finance.ui.theme.NuPurple
import com.megaproyecto.health.finance.ui.theme.TextPrimary
import com.megaproyecto.health.finance.ui.theme.TextSecondary
import com.megaproyecto.health.finance.util.CurrencyUtils

@Composable
fun EditAccountDialog(
    account: AccountBalance,
    onDismiss: () -> Unit,
    onConfirm: (Double) -> Unit
) {
    var amountText by remember { mutableStateOf(account.balance.toLong().toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RectangleShape,
        containerColor = DarkSurfaceCard,
        title = {
            Text(
                text = "Editar Saldo: ${account.name}",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        },
        text = {
            Column {
                Text(
                    text = "Ingresa el saldo real actual para ${account.name}:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { input ->
                        amountText = input.filter { it.isDigit() || it == '.' }
                    },
                    label = { Text("Nuevo Saldo ($)") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            tint = HighDensityLavender
                        )
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
                        .testTag("account_balance_input")
                )
                if (amountText.isNotEmpty()) {
                    val parsed = amountText.toDoubleOrNull() ?: 0.0
                    Text(
                        text = "Vista previa: ${CurrencyUtils.formatCOP(parsed)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = HighDensityLavender,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull() ?: account.balance
                    onConfirm(amount)
                },
                shape = RectangleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = HighDensityLavender,
                    contentColor = HighDensityLavenderDark
                ),
                modifier = Modifier.testTag("save_account_balance_button")
            ) {
                Text("Guardar Saldo", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        }
    )
}

@Composable
fun AddEditExpenseDialog(
    expense: FixedExpense? = null,
    onDismiss: () -> Unit,
    onConfirm: (title: String, amount: Double, category: String) -> Unit,
    onDelete: (() -> Unit)? = null
) {
    var title by remember { mutableStateOf(expense?.title ?: "") }
    var amountText by remember { mutableStateOf(expense?.amount?.toLong()?.toString() ?: "") }
    var category by remember { mutableStateOf(expense?.category ?: "DEBT") }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RectangleShape,
        containerColor = DarkSurfaceCard,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (expense == null) "Nuevo Gasto / Deuda Fija" else "Editar Deuda / Gasto",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )
                if (expense != null && onDelete != null) {
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier.testTag("delete_expense_button")
                    ) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Eliminar gasto",
                            tint = CoralRed
                        )
                    }
                }
            }
        },
        text = {
            Column {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Nombre o Concepto (ej. Vuelos, Suscripción)") },
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
                        .testTag("expense_title_input")
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { input ->
                        amountText = input.filter { it.isDigit() || it == '.' }
                    },
                    label = { Text("Monto ($)") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            tint = CoralRed
                        )
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
                        .testTag("expense_amount_input")
                )
                if (amountText.isNotEmpty()) {
                    val parsed = amountText.toDoubleOrNull() ?: 0.0
                    Text(
                        text = "Total a deducir: -${CurrencyUtils.formatCOP(parsed)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = CoralRed,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        val amount = amountText.toDoubleOrNull() ?: 0.0
                        onConfirm(title.trim(), amount, category)
                    }
                },
                enabled = title.isNotBlank() && (amountText.toDoubleOrNull() ?: 0.0) > 0,
                shape = RectangleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = HighDensityLavender,
                    contentColor = HighDensityLavenderDark
                ),
                modifier = Modifier.testTag("save_expense_button")
            ) {
                Text(if (expense == null) "Agregar" else "Actualizar", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        }
    )
}

@Composable
fun EditMedellinFundDialog(
    currentFund: Double,
    excedenteLiquido: Double,
    onDismiss: () -> Unit,
    onConfirm: (Double) -> Unit
) {
    var amountText by remember { mutableStateOf(currentFund.toLong().toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RectangleShape,
        containerColor = DarkSurfaceCard,
        title = {
            Text(
                text = "Editar Fondo Disponible",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        },
        text = {
            Column {
                Text(
                    text = "Ajusta la cantidad de dinero ahorrado o asignado para el viaje:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(14.dp))
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { input ->
                        amountText = input.filter { it.isDigit() || it == '.' }
                    },
                    label = { Text("Fondo Disponible ($)") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            tint = HighDensityLavender
                        )
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
                        .testTag("medellin_fund_input")
                )

                if (excedenteLiquido > 0) {
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedButton(
                        onClick = {
                            amountText = excedenteLiquido.toLong().toString()
                        },
                        shape = RectangleShape,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Usar mi Excedente Libre (${CurrencyUtils.formatCOP(excedenteLiquido)})",
                            style = MaterialTheme.typography.labelMedium,
                            color = HighDensityLavender
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull() ?: currentFund
                    onConfirm(amount)
                },
                shape = RectangleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = HighDensityLavender,
                    contentColor = HighDensityLavenderDark
                ),
                modifier = Modifier.testTag("save_medellin_fund_button")
            ) {
                Text("Actualizar Fondo", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        }
    )
}

@Composable
fun EditDadContributionDialog(
    currentCommitted: Double,
    currentPaid: Double,
    onDismiss: () -> Unit,
    onConfirm: (totalCommitted: Double, paidAmount: Double) -> Unit
) {
    var committedText by remember { mutableStateOf(currentCommitted.toLong().toString()) }
    var paidText by remember { mutableStateOf(currentPaid.toLong().toString()) }

    val committed = committedText.toDoubleOrNull() ?: currentCommitted
    val paid = paidText.toDoubleOrNull() ?: currentPaid
    val pending = (committed - paid).coerceAtLeast(0.0)

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RectangleShape,
        containerColor = DarkSurfaceCard,
        title = {
            Text(
                text = "👨‍👦 Configurar Abono de Papá",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        },
        text = {
            Column {
                Text(
                    text = "Ajusta el monto total que tu papá aportará para el viaje y lo que ya te ha entregado.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = committedText,
                    onValueChange = { input ->
                        committedText = input.filter { it.isDigit() || it == '.' }
                    },
                    label = { Text("Total Comprometido por Papá ($)") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            tint = HighDensityLavender
                        )
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
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = paidText,
                    onValueChange = { input ->
                        paidText = input.filter { it.isDigit() || it == '.' }
                    },
                    label = { Text("Total ya Recibido / Abonado ($)") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            tint = EmeraldGreen
                        )
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    shape = RectangleShape,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldGreen,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedContainerColor = DarkSurfaceInner,
                        unfocusedContainerColor = DarkSurfaceInner
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Pendiente por recibir de papá: ${CurrencyUtils.formatCOP(pending)}",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = if (pending > 0) HighDensityLavender else EmeraldGreen
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onConfirm(committed, paid)
                },
                shape = RectangleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = HighDensityLavender,
                    contentColor = HighDensityLavenderDark
                )
            ) {
                Text("Guardar Cambios", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        }
    )
}

@Composable
fun RegisterDadAbonoDialog(
    pendingAmount: Double,
    accounts: List<AccountBalance>,
    onDismiss: () -> Unit,
    onConfirm: (amount: Double, targetAccount: String?) -> Unit
) {
    var amountText by remember { mutableStateOf(if (pendingAmount > 0) pendingAmount.toLong().toString() else "50000") }
    var selectedAccount by remember { mutableStateOf<String?>("Nequi") }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RectangleShape,
        containerColor = DarkSurfaceCard,
        title = {
            Text(
                text = "💰 Registrar Nuevo Abono de Papá",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        },
        text = {
            Column {
                Text(
                    text = "¿Cuánto te acaba de transferir o entregar tu papá? (Faltan ${CurrencyUtils.formatCOP(pendingAmount)})",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { input ->
                        amountText = input.filter { it.isDigit() || it == '.' }
                    },
                    label = { Text("Monto Abonado ($)") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            tint = EmeraldGreen
                        )
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    shape = RectangleShape,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldGreen,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedContainerColor = DarkSurfaceInner,
                        unfocusedContainerColor = DarkSurfaceInner
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "¿A qué cuenta ingresó el dinero?",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextSecondary
                )

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Nequi", "Cuenta Nu", "Efectivo").forEach { acc ->
                        val isSelected = selectedAccount == acc
                        OutlinedButton(
                            onClick = { selectedAccount = if (isSelected) null else acc },
                            shape = RectangleShape,
                            border = BorderStroke(2.dp, if (isSelected) EmeraldGreen else CardBorder),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isSelected) EmeraldGreen.copy(alpha = 0.2f) else DarkSurfaceInner
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = acc,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) EmeraldGreen else TextPrimary
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull() ?: 0.0
                    if (amount > 0) {
                        onConfirm(amount, selectedAccount)
                    }
                },
                shape = RectangleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = EmeraldGreen,
                    contentColor = com.megaproyecto.health.finance.ui.theme.EmeraldGreenDark
                )
            ) {
                Text("Registrar Abono", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        }
    )
}

@Composable
fun AddPendingDebtDialog(
    onDismiss: () -> Unit,
    onConfirm: (debtorName: String, amount: Double, description: String) -> Unit
) {
    var debtorName by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RectangleShape,
        containerColor = DarkSurfaceCard,
        title = {
            Text(
                text = "📝 Nueva Deuda Pendiente",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        },
        text = {
            Column {
                Text(
                    text = "Registra a quién le prestaste dinero y cuánto te debe:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = debtorName,
                    onValueChange = { debtorName = it },
                    label = { Text("Nombre de la persona (ej. Camilo, Mateo)") },
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
                        .testTag("debtor_name_input")
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { input ->
                        amountText = input.filter { it.isDigit() || it == '.' }
                    },
                    label = { Text("Monto que te debe ($)") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            tint = EmeraldGreen
                        )
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    shape = RectangleShape,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldGreen,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedContainerColor = DarkSurfaceInner,
                        unfocusedContainerColor = DarkSurfaceInner
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("debt_amount_input")
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Motivo / Concepto (opcional)") },
                    placeholder = { Text("Ej. Almuerzo, salida viernes, préstamo") },
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
                        .testTag("debt_description_input")
                )

                if (amountText.isNotEmpty()) {
                    val parsed = amountText.toDoubleOrNull() ?: 0.0
                    Text(
                        text = "Total por cobrar: ${CurrencyUtils.formatCOP(parsed)}",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = EmeraldGreen,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull() ?: 0.0
                    if (debtorName.isNotBlank() && amount > 0) {
                        onConfirm(debtorName.trim(), amount, description.trim())
                    }
                },
                enabled = debtorName.isNotBlank() && (amountText.toDoubleOrNull() ?: 0.0) > 0,
                shape = RectangleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = HighDensityLavender,
                    contentColor = HighDensityLavenderDark
                ),
                modifier = Modifier.testTag("save_debt_button")
            ) {
                Text("Guardar Deuda", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        }
    )
}

@Composable
fun SettleDebtDialog(
    debt: PendingDebt,
    onDismiss: () -> Unit,
    onConfirm: (targetAccount: String) -> Unit
) {
    var selectedAccount by remember { mutableStateOf("Nequi") }

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RectangleShape,
        containerColor = DarkSurfaceCard,
        title = {
            Text(
                text = "💰 Registrar Pago Recibido",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        },
        text = {
            Column {
                Text(
                    text = "¡${debt.debtorName} te pagó ${CurrencyUtils.formatCOP(debt.amount)}!",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = EmeraldGreen
                )

                if (debt.description.isNotBlank()) {
                    Text(
                        text = "Concepto: ${debt.description}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "¿En qué medio o cuenta recibiste este pago?",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Account Selection Options: Efectivo, Nu, Nequi
                listOf(
                    Triple("Nequi", NequiPink, "Saldo en Nequi"),
                    Triple("Cuenta Nu", NuPurple, "Saldo en Cuenta Nu"),
                    Triple("Efectivo", CashGold, "Efectivo en mano")
                ).forEach { (accountName, brandColor, subtitle) ->
                    val isSelected = selectedAccount == accountName
                    OutlinedButton(
                        onClick = { selectedAccount = accountName },
                        shape = RectangleShape,
                        border = BorderStroke(
                            width = if (isSelected) 2.dp else 1.dp,
                            color = if (isSelected) brandColor else CardBorder
                        ),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = if (isSelected) brandColor.copy(alpha = 0.15f) else DarkSurfaceInner
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .testTag("settle_account_option_${accountName.lowercase().replace(" ", "_")}")
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = accountName,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) brandColor else TextPrimary
                                )
                                Text(
                                    text = subtitle,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontSize = 11.sp,
                                    color = TextSecondary
                                )
                            }

                            if (isSelected) {
                                Text(
                                    text = "+${CurrencyUtils.formatCOP(debt.amount)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = brandColor
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "✓ Se sumarán ${CurrencyUtils.formatCOP(debt.amount)} a tu saldo de $selectedAccount y la deuda se marcará como saldada.",
                    style = MaterialTheme.typography.bodySmall,
                    fontSize = 11.sp,
                    color = HighDensityLavender
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(selectedAccount) },
                shape = RectangleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = when (selectedAccount) {
                        "Cuenta Nu" -> NuPurple
                        "Nequi" -> NequiPink
                        else -> CashGold
                    },
                    contentColor = if (selectedAccount == "Efectivo") DarkSurfaceCard else androidx.compose.ui.graphics.Color.White
                ),
                modifier = Modifier.testTag("confirm_settle_debt_button")
            ) {
                Text("Acreditar a $selectedAccount", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        }
    )
}

