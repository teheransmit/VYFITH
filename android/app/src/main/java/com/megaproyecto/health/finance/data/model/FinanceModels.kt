package com.megaproyecto.health.finance.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entidad 1: Saldos de Cuentas Líquidas
 */
@Entity(tableName = "accounts")
data class AccountBalance(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val name: String, // "Efectivo", "Cuenta Nu", "Nequi"
    val balance: Double,
    val type: String // "CASH", "NU", "NEQUI"
)

/**
 * Entidad 2: Gastos Fijos, Deudas de Honor y Suscripciones
 */
@Entity(tableName = "fixed_expenses")
data class FixedExpense(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val title: String,
    val amount: Double,
    val category: String = "DEBT" // "DEBT" or "SUBSCRIPTION" or "GENERAL"
)

/**
 * Entidad 3: Registro Diario de Ingresos y Gastos
 * Molly queda purgada/desactivada (mollyWalk = false por defecto y en toda operación).
 */
@Entity(tableName = "daily_logs")
data class DailyLog(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val dateDisplay: String,
    val walksIncome: Double,
    val siennaWalk: Boolean = false,
    val fridaWalk: Boolean = false,
    val mollyWalk: Boolean = false, // Purged / always false
    val rappiIncome: Double = 0.0,
    val dailyExpense: Double = 0.0,
    val netChange: Double = 0.0,
    val targetAccountName: String,
    val note: String = ""
)

/**
 * Entidad 4: Configuración y Presupuesto del Viaje a Medellín
 */
@Entity(tableName = "trip_settings")
data class TripSettings(
    @PrimaryKey
    val id: Int = 1,
    val availableFund: Double = 550000.0,
    val dadTotalCommitted: Double = 450000.0,
    val dadPaidAmount: Double = 140000.0,
    val pendingWalksWeekly: Double = 48700.0
)

/**
 * Entidad 5: Cuentas por Cobrar a Terceros (Gente que me debe plata)
 */
@Entity(tableName = "pending_debts")
data class PendingDebt(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val debtorName: String,
    val amount: Double,
    val description: String = "",
    val dateCreated: String = "",
    val isPaid: Boolean = false,
    val paidDate: String? = null,
    val paidToAccount: String? = null
)

/**
 * Rubro Fijo de Viaje (Desglose del Costo Total de Medellín: $584.549 COP)
 */
data class TripFixedItem(
    val id: String,
    val title: String,
    val amount: Double,
    val category: String
)
