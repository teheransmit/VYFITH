package com.megaproyecto.health.finance.data.repository

import com.megaproyecto.health.finance.data.db.AppDao
import com.megaproyecto.health.finance.data.model.AccountBalance
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.data.model.FixedExpense
import com.megaproyecto.health.finance.data.model.PendingDebt
import com.megaproyecto.health.finance.data.model.TripFixedItem
import com.megaproyecto.health.finance.data.model.TripSettings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class FinanceRepository(val dao: AppDao) {

    val accounts: Flow<List<AccountBalance>> = dao.getAllAccounts()
    val fixedExpenses: Flow<List<FixedExpense>> = dao.getAllFixedExpenses()
    val dailyLogs: Flow<List<DailyLog>> = dao.getAllDailyLogs()
    val tripSettings: Flow<TripSettings?> = dao.getTripSettings()
    val pendingWalksWeekly: Flow<Double> = dao.getTripSettings().map { it?.pendingWalksWeekly ?: 0.0 }
    val pendingDebts: Flow<List<PendingDebt>> = dao.getActivePendingDebts()
    val allPendingDebts: Flow<List<PendingDebt>> = dao.getAllPendingDebts()

    private fun formatCOP(amount: Double): String {
        return NumberFormat.getCurrencyInstance(Locale("es", "CO")).apply {
            maximumFractionDigits = 0
            minimumFractionDigits = 0
        }.format(amount)
    }

    suspend fun checkAndSeedInitialData() {
        val currentAccounts = dao.getAllAccounts().firstOrNull()
        if (currentAccounts.isNullOrEmpty()) {
            dao.insertAccounts(
                listOf(
                    AccountBalance(name = "Efectivo", balance = 85000.0, type = "CASH"),
                    AccountBalance(name = "Cuenta Nu", balance = 320000.0, type = "NU"),
                    AccountBalance(name = "Nequi", balance = 245000.0, type = "NEQUI")
                )
            )
        }

        val currentExpenses = dao.getAllFixedExpenses().firstOrNull()
        if (currentExpenses.isNullOrEmpty()) {
            dao.insertFixedExpenses(
                listOf(
                    FixedExpense(title = "Vuelos", amount = 140000.0, category = "DEBT"),
                    FixedExpense(title = "Suscripciones (Spotify/Crunchyroll)", amount = 10200.0, category = "SUBSCRIPTION"),
                    FixedExpense(title = "Motilada", amount = 25000.0, category = "GENERAL")
                )
            )
        } else if (currentExpenses.none { it.title.equals("Motilada", ignoreCase = true) }) {
            dao.insertFixedExpense(FixedExpense(title = "Motilada", amount = 25000.0, category = "GENERAL"))
        }

        val currentLogs = dao.getAllDailyLogs().firstOrNull()
        if (currentLogs.isNullOrEmpty()) {
            val cal = java.util.Calendar.getInstance()
            cal.set(2026, java.util.Calendar.AUGUST, 26, 12, 0, 0)
            val log26 = DailyLog(
                timestamp = cal.timeInMillis,
                dateDisplay = "26 de agosto, 2026",
                walksIncome = 9000.0,
                siennaWalk = true,
                fridaWalk = false,
                mollyWalk = false,
                rappiIncome = 25000.0,
                dailyExpense = 0.0,
                netChange = 25000.0,
                targetAccountName = "Nequi",
                note = "Paseo Sienna mañana + 2 horas Rappi tarde"
            )

            cal.set(2026, java.util.Calendar.AUGUST, 27, 12, 0, 0)
            val log27 = DailyLog(
                timestamp = cal.timeInMillis,
                dateDisplay = "27 de agosto, 2026",
                walksIncome = 5850.0,
                siennaWalk = false,
                fridaWalk = true,
                mollyWalk = false,
                rappiIncome = 0.0,
                dailyExpense = 3500.0,
                netChange = -3500.0,
                targetAccountName = "Efectivo",
                note = "Paseo Frida"
            )

            cal.set(2026, java.util.Calendar.AUGUST, 28, 12, 0, 0)
            val log28 = DailyLog(
                timestamp = cal.timeInMillis,
                dateDisplay = "28 de agosto, 2026",
                walksIncome = 14850.0,
                siennaWalk = true,
                fridaWalk = true,
                mollyWalk = false,
                rappiIncome = 18000.0,
                dailyExpense = 0.0,
                netChange = 18000.0,
                targetAccountName = "Cuenta Nu",
                note = "Sienna + Frida + Turno Rappi viernes"
            )

            cal.set(2026, java.util.Calendar.AUGUST, 29, 12, 0, 0)
            val log29 = DailyLog(
                timestamp = cal.timeInMillis,
                dateDisplay = "29 de agosto, 2026",
                walksIncome = 0.0,
                siennaWalk = false,
                fridaWalk = false,
                mollyWalk = false,
                rappiIncome = 32000.0,
                dailyExpense = 6000.0,
                netChange = 26000.0,
                targetAccountName = "Nequi",
                note = "Turno Rappi noche de sábado"
            )

            cal.set(2026, java.util.Calendar.AUGUST, 30, 12, 0, 0)
            val log30 = DailyLog(
                timestamp = cal.timeInMillis,
                dateDisplay = "30 de agosto, 2026",
                walksIncome = 14850.0,
                siennaWalk = true,
                fridaWalk = true,
                mollyWalk = false,
                rappiIncome = 22000.0,
                dailyExpense = 0.0,
                netChange = 22000.0,
                targetAccountName = "Cuenta Nu",
                note = "Paseos Sienna y Frida + Rappi domingo"
            )

            cal.set(2026, java.util.Calendar.AUGUST, 31, 12, 0, 0)
            val log31 = DailyLog(
                timestamp = cal.timeInMillis,
                dateDisplay = "31 de agosto, 2026",
                walksIncome = 9000.0,
                siennaWalk = true,
                fridaWalk = false,
                mollyWalk = false,
                rappiIncome = 0.0,
                dailyExpense = 0.0,
                netChange = 0.0,
                targetAccountName = "Efectivo",
                note = "Paseo Sienna"
            )

            dao.insertDailyLog(log26)
            dao.insertDailyLog(log27)
            dao.insertDailyLog(log28)
            dao.insertDailyLog(log29)
            dao.insertDailyLog(log30)
            dao.insertDailyLog(log31)
        }

        val currentTrip = dao.getTripSettings().firstOrNull()
        if (currentTrip == null) {
            dao.saveTripSettings(
                TripSettings(
                    id = 1,
                    availableFund = 550000.0,
                    dadTotalCommitted = 450000.0,
                    dadPaidAmount = 140000.0,
                    pendingWalksWeekly = 48700.0
                )
            )
        }
    }

    suspend fun updateAccount(account: AccountBalance) {
        dao.updateAccount(account)
    }

    suspend fun updateAccountBalance(name: String, amount: Double) {
        dao.updateAccountBalanceByName(name, amount)
    }

    suspend fun addToAccount(name: String, amount: Double) {
        dao.addToAccountBalance(name, amount)
    }

    suspend fun addFixedExpense(title: String, amount: Double, category: String = "DEBT") {
        dao.insertFixedExpense(FixedExpense(title = title, amount = amount, category = category))
    }

    suspend fun updateFixedExpense(expense: FixedExpense) {
        dao.updateFixedExpense(expense)
    }

    suspend fun deleteFixedExpense(id: Int) {
        dao.deleteFixedExpenseById(id)
    }

    /**
     * Guarda el registro de una jornada diaria.
     * Regla estricta: Molly queda purgada (mollyWalk = false).
     * Los paseos caninos (Sienna $9.000, Frida $5.850) no se suman de inmediato a la cuenta líquida,
     * sino que se acumulan en pendingWalksWeekly.
     * La variación líquida inmediata aplicada a la cuenta es Rappi menos gastos.
     */
    suspend fun saveDailyRecord(
        dateDisplay: String,
        sienna: Boolean,
        frida: Boolean,
        molly: Boolean = false, // Ignorado / forzado a false
        rappi: Double,
        expense: Double,
        targetAccount: String,
        note: String,
        fridaRate: Double = 5850.0
    ): Double {
        var walksSum = 0.0
        if (sienna) walksSum += 9000.0
        if (frida) walksSum += fridaRate
        // Molly purgada: cero adición monetaria

        val immediateNetChange = rappi - expense

        val newLog = DailyLog(
            timestamp = System.currentTimeMillis(),
            dateDisplay = dateDisplay,
            walksIncome = walksSum,
            siennaWalk = sienna,
            fridaWalk = frida,
            mollyWalk = false, // STRICT: always false
            rappiIncome = rappi,
            dailyExpense = expense,
            netChange = immediateNetChange,
            targetAccountName = targetAccount,
            note = if (walksSum > 0) {
                if (note.isNotBlank()) "$note (Paseos por cobrar: +${formatCOP(walksSum)})"
                else "Paseos por cobrar: +${formatCOP(walksSum)}"
            } else note
        )

        dao.insertDailyLog(newLog)

        if (walksSum > 0) {
            dao.addPendingWalksWeekly(walksSum)
        }

        if (immediateNetChange != 0.0) {
            dao.addToAccountBalance(targetAccount, immediateNetChange)
        }

        return immediateNetChange
    }

    /**
     * Liquidación semanal de paseos:
     * Acredita pendingWalksWeekly a la cuenta seleccionada, resetea a cero,
     * e inserta un log de conciliación.
     */
    suspend fun settleWeeklyWalks(targetAccountName: String): Double {
        val current = dao.getTripSettings().firstOrNull() ?: TripSettings()
        val pendingAmount = current.pendingWalksWeekly
        if (pendingAmount <= 0.0) return 0.0

        // 1. Acreditar a la cuenta destino
        dao.addToAccountBalance(targetAccountName, pendingAmount)

        // 2. Resetear contador semanal
        dao.resetPendingWalksWeekly()

        // 3. Registrar log de conciliación en el historial
        val dateFormat = SimpleDateFormat("d 'de' MMMM, yyyy", Locale("es", "CO"))
        val todayStr = dateFormat.format(Date())
        val settlementLog = DailyLog(
            timestamp = System.currentTimeMillis(),
            dateDisplay = todayStr,
            walksIncome = pendingAmount,
            siennaWalk = false,
            fridaWalk = false,
            mollyWalk = false,
            rappiIncome = 0.0,
            dailyExpense = 0.0,
            netChange = pendingAmount,
            targetAccountName = targetAccountName,
            note = "Liquidación semanal de paseos cobrados (+${formatCOP(pendingAmount)})"
        )
        dao.insertDailyLog(settlementLog)

        return pendingAmount
    }

    suspend fun deleteDailyLog(id: Int) {
        dao.deleteDailyLogById(id)
    }

    suspend fun updateTripFund(newFund: Double) {
        val current = dao.getTripSettings().firstOrNull() ?: TripSettings()
        dao.saveTripSettings(current.copy(availableFund = newFund))
    }

    suspend fun updateDadContribution(totalCommitted: Double, paidAmount: Double) {
        val current = dao.getTripSettings().firstOrNull() ?: TripSettings()
        dao.saveTripSettings(
            current.copy(
                dadTotalCommitted = totalCommitted,
                dadPaidAmount = paidAmount
            )
        )
    }

    suspend fun registerDadAbono(addedAmount: Double, targetAccountName: String? = null) {
        val current = dao.getTripSettings().firstOrNull() ?: TripSettings()
        val newPaid = current.dadPaidAmount + addedAmount
        dao.saveTripSettings(current.copy(dadPaidAmount = newPaid))
        if (!targetAccountName.isNullOrBlank() && addedAmount > 0) {
            dao.addToAccountBalance(targetAccountName, addedAmount)
        }
    }

    // ----------------------------------------------------
    // Pending Debts (Gente que me debe plata)
    // ----------------------------------------------------
    suspend fun addPendingDebt(debtorName: String, amount: Double, description: String = "") {
        val dateFormat = SimpleDateFormat("d 'de' MMMM, yyyy", Locale("es", "CO"))
        val todayStr = dateFormat.format(Date())
        dao.insertPendingDebt(
            PendingDebt(
                debtorName = debtorName.trim(),
                amount = amount,
                description = description.trim(),
                dateCreated = todayStr,
                isPaid = false
            )
        )
    }

    suspend fun settlePendingDebt(debtId: Int, targetAccountName: String): PendingDebt? {
        val allDebts = dao.getAllPendingDebts().firstOrNull() ?: emptyList()
        val debt = allDebts.find { it.id == debtId } ?: return null
        val dateFormat = SimpleDateFormat("d 'de' MMMM, yyyy", Locale("es", "CO"))
        val todayStr = dateFormat.format(Date())

        dao.updatePendingDebt(
            debt.copy(
                isPaid = true,
                paidDate = todayStr,
                paidToAccount = targetAccountName
            )
        )

        dao.addToAccountBalance(targetAccountName, debt.amount)
        return debt
    }

    suspend fun deletePendingDebt(id: Int) {
        dao.deletePendingDebtById(id)
    }

    companion object {
        val DEFAULT_MEDELLIN_ITEMS = listOf(
            TripFixedItem("1", "Alojamiento", 164550.0, "HOTEL"),
            TripFixedItem("2", "Bus Aeropuerto (Combuses)", 40000.0, "TRANSIT"),
            TripFixedItem("3", "Alimentación (5 Días)", 225000.0, "FOOD"),
            TripFixedItem("4", "Transporte Local (Metro/Taxi)", 35000.0, "TAXI"),
            TripFixedItem("5", "Actividades & Tours", 70000.0, "ACTIVITIES"),
            TripFixedItem("6", "Fondo de Imprevistos", 50000.0, "EMERGENCY")
        )

        const val TOTAL_ESTIMATED_TRIP_COST = 584549.0
        const val NU_ANNUAL_EFFECTIVE_RATE = 0.0930

        fun calculateDailyNuYield(balance: Double, rateEA: Double = NU_ANNUAL_EFFECTIVE_RATE): Double {
            if (balance <= 0.0) return 0.0
            val dailyCompoundRate = Math.pow(1.0 + rateEA, 1.0 / 365.0) - 1.0
            val dailyYield = balance * dailyCompoundRate
            return Math.round(dailyYield * 100.0) / 100.0
        }
    }
}
