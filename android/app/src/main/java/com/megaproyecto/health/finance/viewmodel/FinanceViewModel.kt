package com.megaproyecto.health.finance.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.megaproyecto.health.finance.data.api.FinancialContext
import com.megaproyecto.health.finance.data.api.GeminiClient
import com.megaproyecto.health.finance.data.db.AppDatabase
import com.megaproyecto.health.finance.data.model.AccountBalance
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.data.model.FixedExpense
import com.megaproyecto.health.finance.data.model.PendingDebt
import com.megaproyecto.health.finance.data.model.TripFixedItem
import com.megaproyecto.health.finance.data.repository.FinanceRepository
import com.megaproyecto.health.finance.util.CurrencyUtils
import com.megaproyecto.health.finance.util.NotificationHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class DashboardUiState(
    val accounts: List<AccountBalance> = emptyList(),
    val fixedExpenses: List<FixedExpense> = emptyList(),
    val totalBalances: Double = 0.0,
    val totalDebtsAndExpenses: Double = 0.0,
    val excedenteLiquidoLibre: Double = 0.0,
    val isPositiveExcedente: Boolean = true,
    val isLoading: Boolean = false
)

data class DailyRegisterUiState(
    val siennaWalk: Boolean = false,
    val fridaWalk: Boolean = false,
    val rappiInput: String = "",
    val expenseInput: String = "",
    val expenseNote: String = "",
    val selectedTargetAccount: String = "Nequi",
    val walksTotal: Double = 0.0,
    val rappiAmount: Double = 0.0,
    val totalIncome: Double = 0.0,
    val totalExpense: Double = 0.0,
    val netDayBalance: Double = 0.0,
    val isSaving: Boolean = false
)

data class MedellinSimulatorUiState(
    val availableFund: Double = 550000.0,
    val totalEstimatedCost: Double = FinanceRepository.TOTAL_ESTIMATED_TRIP_COST,
    val tripItems: List<TripFixedItem> = FinanceRepository.DEFAULT_MEDELLIN_ITEMS,
    val balanceParaLujos: Double = 0.0, // availableFund - totalEstimatedCost
    val coveragePercent: Float = 0f,
    val isDeficit: Boolean = true,
    val deficitAmount: Double = 0.0,
    val surplusAmount: Double = 0.0,
    // Dad's contribution
    val dadTotalCommitted: Double = 450000.0,
    val dadPaidAmount: Double = 140000.0,
    val dadPendingAmount: Double = 310000.0,
    val dadProgressPercent: Float = 0.311f,
    // Real forecast with Dad's support
    val personalRemainingTarget: Double = 134549.0, // totalEstimatedCost - dadTotalCommitted
    val projectedFundWithDad: Double = 860000.0, // availableFund + dadPendingAmount
    val projectedDeficitOrSurplusWithDad: Double = 275451.0,
    val isProjectedSurplusWithDad: Boolean = true
)

data class GeminiAdvisorUiState(
    val analysisText: String? = null,
    val isAnalyzing: Boolean = false,
    val lastPromptUsed: String? = null,
    val customQueryInput: String = "",
    val notificationsEnabled: Boolean = false,
    val reminderHour: Int = 20,
    val reminderMinute: Int = 0
)

data class CalendarReportsUiState(
    val selectedYear: Int = 2026,
    val selectedMonth: Int = java.util.Calendar.AUGUST,
    val selectedDay: Int? = null,
    val isGeneratingReport: Boolean = false,
    val geminiReportText: String? = null
)

class FinanceViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: FinanceRepository

    private val _userMessage = MutableSharedFlow<String>()
    val userMessage: SharedFlow<String> = _userMessage.asSharedFlow()

    private val _geminiAdvisorState = MutableStateFlow(
        GeminiAdvisorUiState(
            notificationsEnabled = NotificationHelper.isNotificationEnabled(application),
            reminderHour = NotificationHelper.getReminderTime(application).first,
            reminderMinute = NotificationHelper.getReminderTime(application).second
        )
    )
    val geminiAdvisorState: StateFlow<GeminiAdvisorUiState> = _geminiAdvisorState.asStateFlow()

    init {
        val db = AppDatabase.getDatabase(application)
        repository = FinanceRepository(db.appDao())
        viewModelScope.launch(Dispatchers.IO) {
            repository.checkAndSeedInitialData()
        }
    }

    // Dashboard State Flow
    val dashboardUiState: StateFlow<DashboardUiState> = combine(
        repository.accounts,
        repository.fixedExpenses
    ) { accountsList, expensesList ->
        val safeAccounts = if (accountsList.isEmpty()) {
            listOf(
                AccountBalance(1, "Efectivo", 85000.0, "CASH"),
                AccountBalance(2, "Cuenta Nu", 320000.0, "NU"),
                AccountBalance(3, "Nequi", 245000.0, "NEQUI")
            )
        } else {
            accountsList
        }

        val safeExpenses = if (expensesList.isEmpty()) {
            listOf(
                FixedExpense(1, "Vuelos", 140000.0, "DEBT"),
                FixedExpense(2, "Suscripciones", 10200.0, "SUBSCRIPTION")
            )
        } else {
            expensesList
        }

        val totalBalances = safeAccounts.sumOf { it.balance }
        val totalDebts = safeExpenses.sumOf { it.amount }
        val excedente = totalBalances - totalDebts

        DashboardUiState(
            accounts = safeAccounts,
            fixedExpenses = safeExpenses,
            totalBalances = totalBalances,
            totalDebtsAndExpenses = totalDebts,
            excedenteLiquidoLibre = excedente,
            isPositiveExcedente = excedente >= 0.0,
            isLoading = false
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = DashboardUiState(isLoading = true)
    )

    // Daily Register Form State
    private val _dailyFormState = MutableStateFlow(DailyRegisterUiState())
    val dailyFormState: StateFlow<DailyRegisterUiState> = _dailyFormState.asStateFlow()

    // Daily Logs State Flow
    val dailyLogs: StateFlow<List<DailyLog>> = repository.dailyLogs.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Pending Debts State Flow (Gente que me debe)
    val pendingDebts: StateFlow<List<PendingDebt>> = repository.pendingDebts.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Pending Dog Walks Weekly State Flow (Cuentas por cobrar acumuladas de paseos)
    val pendingWalksWeekly: StateFlow<Double> = repository.pendingWalksWeekly.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 48700.0
    )

    // Medellin Simulator State Flow
    val medellinUiState: StateFlow<MedellinSimulatorUiState> = repository.tripSettings.combine(
        dashboardUiState
    ) { tripSettings, _ ->
        val fund = tripSettings?.availableFund ?: 550000.0
        val cost = FinanceRepository.TOTAL_ESTIMATED_TRIP_COST
        val balance = fund - cost
        val ratio = if (cost > 0) (fund / cost).toFloat() else 0f
        val isDeficit = balance < 0
        val deficit = if (isDeficit) -balance else 0.0
        val surplus = if (!isDeficit) balance else 0.0

        val dadCommitted = tripSettings?.dadTotalCommitted ?: 450000.0
        val dadPaid = tripSettings?.dadPaidAmount ?: 140000.0
        val dadPending = (dadCommitted - dadPaid).coerceAtLeast(0.0)
        val dadProgress = if (dadCommitted > 0) (dadPaid / dadCommitted).toFloat().coerceIn(0f, 1f) else 0f

        val personalTarget = (cost - dadCommitted).coerceAtLeast(0.0)
        val projectedWithDad = fund + dadPending
        val projectedBalanceWithDad = projectedWithDad - cost
        val isProjectedSurplusWithDad = projectedBalanceWithDad >= 0

        MedellinSimulatorUiState(
            availableFund = fund,
            totalEstimatedCost = cost,
            tripItems = FinanceRepository.DEFAULT_MEDELLIN_ITEMS,
            balanceParaLujos = balance,
            coveragePercent = ratio.coerceAtMost(2.0f),
            isDeficit = isDeficit,
            deficitAmount = deficit,
            surplusAmount = surplus,
            dadTotalCommitted = dadCommitted,
            dadPaidAmount = dadPaid,
            dadPendingAmount = dadPending,
            dadProgressPercent = dadProgress,
            personalRemainingTarget = personalTarget,
            projectedFundWithDad = projectedWithDad,
            projectedDeficitOrSurplusWithDad = if (isProjectedSurplusWithDad) projectedBalanceWithDad else -projectedBalanceWithDad,
            isProjectedSurplusWithDad = isProjectedSurplusWithDad
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = MedellinSimulatorUiState()
    )

    // ----------------------------------------------------
    // Actions: Dashboard
    // ----------------------------------------------------
    fun updateAccountBalance(accountName: String, newBalance: Double) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.updateAccountBalance(accountName, newBalance)
            _userMessage.emit("Saldo de $accountName actualizado")
        }
    }

    fun addFixedExpense(title: String, amount: Double, category: String = "DEBT") {
        viewModelScope.launch(Dispatchers.IO) {
            repository.addFixedExpense(title, amount, category)
            _userMessage.emit("Gasto '$title' agregado")
        }
    }

    fun updateFixedExpense(id: Int, title: String, amount: Double, category: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.updateFixedExpense(FixedExpense(id = id, title = title, amount = amount, category = category))
            _userMessage.emit("Gasto '$title' actualizado")
        }
    }

    fun deleteFixedExpense(id: Int, title: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteFixedExpense(id)
            _userMessage.emit("Gasto '$title' eliminado")
        }
    }

    // ----------------------------------------------------
    // Actions: Registro Diario (Molly completely purged)
    // ----------------------------------------------------
    fun toggleSiennaWalk() {
        _dailyFormState.update { current ->
            val updated = !current.siennaWalk
            recalcDailyState(current.copy(siennaWalk = updated))
        }
    }

    fun toggleFridaWalk() {
        _dailyFormState.update { current ->
            val updated = !current.fridaWalk
            recalcDailyState(current.copy(fridaWalk = updated))
        }
    }

    fun updateRappiInput(input: String) {
        val clean = input.filter { it.isDigit() || it == '.' }
        _dailyFormState.update { current ->
            recalcDailyState(current.copy(rappiInput = clean))
        }
    }

    fun addQuickRappiAmount(amount: Double) {
        _dailyFormState.update { current ->
            val currentAmount = current.rappiInput.toDoubleOrNull() ?: 0.0
            val newTotal = (currentAmount + amount).toLong().toString()
            recalcDailyState(current.copy(rappiInput = newTotal))
        }
    }

    fun updateExpenseInput(input: String) {
        val clean = input.filter { it.isDigit() || it == '.' }
        _dailyFormState.update { current ->
            recalcDailyState(current.copy(expenseInput = clean))
        }
    }

    fun updateExpenseNote(note: String) {
        _dailyFormState.update { it.copy(expenseNote = note) }
    }

    fun selectTargetAccount(accountName: String) {
        _dailyFormState.update { it.copy(selectedTargetAccount = accountName) }
    }

    private fun recalcDailyState(state: DailyRegisterUiState): DailyRegisterUiState {
        var walks = 0.0
        if (state.siennaWalk) walks += 9000.0
        if (state.fridaWalk) walks += 5850.0

        val rappi = state.rappiInput.toDoubleOrNull() ?: 0.0
        val exp = state.expenseInput.toDoubleOrNull() ?: 0.0
        val liquidNet = rappi - exp

        return state.copy(
            walksTotal = walks,
            rappiAmount = rappi,
            totalIncome = rappi,
            totalExpense = exp,
            netDayBalance = liquidNet
        )
    }

    fun saveDayRecord() {
        val current = _dailyFormState.value
        if (!current.siennaWalk && !current.fridaWalk &&
            current.rappiAmount == 0.0 && current.totalExpense == 0.0
        ) {
            viewModelScope.launch(Dispatchers.IO) {
                _userMessage.emit("Ingresa al menos un paseo, turno Rappi o gasto del día.")
            }
            return
        }

        viewModelScope.launch(Dispatchers.IO) {
            _dailyFormState.update { it.copy(isSaving = true) }
            val dateFormat = SimpleDateFormat("d 'de' MMMM, yyyy", Locale("es", "CO"))
            val todayStr = dateFormat.format(Date())

            val netChange = repository.saveDailyRecord(
                dateDisplay = todayStr,
                sienna = current.siennaWalk,
                frida = current.fridaWalk,
                molly = false,
                rappi = current.rappiAmount,
                expense = current.totalExpense,
                targetAccount = current.selectedTargetAccount,
                note = current.expenseNote
            )

            // Reset Form
            _dailyFormState.value = DailyRegisterUiState(
                selectedTargetAccount = current.selectedTargetAccount
            )

            val walksAdded = current.walksTotal
            val walksMsg = if (walksAdded > 0) " (+${CurrencyUtils.formatCOP(walksAdded)} en Paseos Pendientes de Pago)" else ""
            val sign = if (netChange >= 0) "+$" else "-$"
            val absChange = String.format(Locale("es", "CO"), "%,.0f", kotlin.math.abs(netChange))
            _userMessage.emit("¡Día guardado! Balance neto líquido: $sign$absChange aplicado a ${current.selectedTargetAccount}$walksMsg")
        }
    }

    fun settleWeeklyWalks(targetAccountName: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val amount = repository.settleWeeklyWalks(targetAccountName)
            if (amount > 0) {
                val formatted = CurrencyUtils.formatCOP(amount)
                _userMessage.emit("¡Liquidación exitosa! Se ingresaron $formatted a $targetAccountName como liquidez real.")
            } else {
                _userMessage.emit("No hay saldo pendiente de paseos por liquidar.")
            }
        }
    }

    fun deleteDailyLog(id: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteDailyLog(id)
            _userMessage.emit("Registro eliminado")
        }
    }

    // ----------------------------------------------------
    // Actions: Deudas Pendientes (Gente que me debe plata)
    // ----------------------------------------------------
    fun addPendingDebt(debtorName: String, amount: Double, description: String = "") {
        viewModelScope.launch(Dispatchers.IO) {
            repository.addPendingDebt(debtorName, amount, description)
            _userMessage.emit("Deuda por cobrar de $debtorName por ${CurrencyUtils.formatCOP(amount)} guardada")
        }
    }

    fun settlePendingDebt(debt: PendingDebt, targetAccountName: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val settled = repository.settlePendingDebt(debt.id, targetAccountName)
            if (settled != null) {
                _userMessage.emit("¡Pago de ${CurrencyUtils.formatCOP(settled.amount)} de ${settled.debtorName} acreditado a $targetAccountName!")
            }
        }
    }

    fun deletePendingDebt(debt: PendingDebt) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deletePendingDebt(debt.id)
            _userMessage.emit("Deuda de ${debt.debtorName} eliminada")
        }
    }

    // ----------------------------------------------------
    // Actions: Simulador Medellín
    // ----------------------------------------------------
    fun updateMedellinFund(newFund: Double) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.updateTripFund(newFund)
            _userMessage.emit("Fondo disponible actualizado a $${String.format(Locale("es", "CO"), "%,.0f", newFund)}")
        }
    }

    fun syncFundWithExcedente(excedente: Double) {
        val positiveExcedente = if (excedente > 0) excedente else 0.0
        updateMedellinFund(positiveExcedente)
    }

    fun updateDadContribution(totalCommitted: Double, paidAmount: Double) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.updateDadContribution(totalCommitted, paidAmount)
            _userMessage.emit("Abono de tu papá actualizado: $${String.format(Locale("es", "CO"), "%,.0f", paidAmount)} de $${String.format(Locale("es", "CO"), "%,.0f", totalCommitted)}")
        }
    }

    fun registerDadAbono(addedAmount: Double, targetAccount: String?) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.registerDadAbono(addedAmount, targetAccount)
            val accMsg = if (!targetAccount.isNullOrBlank()) " ingresado a $targetAccount" else ""
            _userMessage.emit("¡Abono de papá por $${String.format(Locale("es", "CO"), "%,.0f", addedAmount)}$accMsg registrado!")
        }
    }

    // ----------------------------------------------------
    // Actions: Asesor IA Gemini
    // ----------------------------------------------------
    fun updateCustomQuery(query: String) {
        _geminiAdvisorState.update { it.copy(customQueryInput = query) }
    }

    fun runGeminiAnalysis(customQuery: String? = null) {
        val prompt = customQuery ?: _geminiAdvisorState.value.customQueryInput.ifBlank { null }

        viewModelScope.launch(Dispatchers.IO) {
            _geminiAdvisorState.update { it.copy(isAnalyzing = true, lastPromptUsed = prompt) }

            val dash = dashboardUiState.value
            val med = medellinUiState.value
            val logs = dailyLogs.value

            val context = FinancialContext(
                accounts = dash.accounts,
                fixedExpenses = dash.fixedExpenses,
                totalBalances = dash.totalBalances,
                totalDebts = dash.totalDebtsAndExpenses,
                excedenteLiquido = dash.excedenteLiquidoLibre,
                medellinAvailableFund = med.availableFund,
                medellinTotalCost = med.totalEstimatedCost,
                tripItems = med.tripItems,
                recentLogs = logs,
                dadTotalCommitted = med.dadTotalCommitted,
                dadPaidAmount = med.dadPaidAmount,
                dadPendingAmount = med.dadPendingAmount
            )

            val result = GeminiClient.analyzeTripViability(context, prompt)
            val responseText = result.getOrElse { "No se pudo generar el análisis en este momento." }

            _geminiAdvisorState.update {
                it.copy(
                    isAnalyzing = false,
                    analysisText = responseText,
                    customQueryInput = ""
                )
            }
        }
    }

    // Calendar & Reports State Flow
    private val _calendarReportsUiState = MutableStateFlow(
        CalendarReportsUiState(
            selectedYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR),
            selectedMonth = java.util.Calendar.getInstance().get(java.util.Calendar.MONTH)
        )
    )
    val calendarReportsUiState: StateFlow<CalendarReportsUiState> = _calendarReportsUiState.asStateFlow()

    // ----------------------------------------------------
    // Actions: Calendario y Reportes
    // ----------------------------------------------------
    fun changeCalendarMonth(delta: Int) {
        _calendarReportsUiState.update { current ->
            val cal = java.util.Calendar.getInstance()
            cal.set(java.util.Calendar.YEAR, current.selectedYear)
            cal.set(java.util.Calendar.MONTH, current.selectedMonth)
            cal.add(java.util.Calendar.MONTH, delta)
            current.copy(
                selectedYear = cal.get(java.util.Calendar.YEAR),
                selectedMonth = cal.get(java.util.Calendar.MONTH),
                selectedDay = null
            )
        }
    }

    fun resetCalendarToToday() {
        val cal = java.util.Calendar.getInstance()
        _calendarReportsUiState.update { current ->
            current.copy(
                selectedYear = cal.get(java.util.Calendar.YEAR),
                selectedMonth = cal.get(java.util.Calendar.MONTH),
                selectedDay = cal.get(java.util.Calendar.DAY_OF_MONTH)
            )
        }
    }

    fun selectCalendarDay(day: Int?) {
        _calendarReportsUiState.update { it.copy(selectedDay = day) }
    }

    fun generateCalendarGeminiReport() {
        val calendarState = _calendarReportsUiState.value
        val dash = dashboardUiState.value
        val med = medellinUiState.value
        val logs = dailyLogs.value

        viewModelScope.launch(Dispatchers.IO) {
            _calendarReportsUiState.update { it.copy(isGeneratingReport = true) }

            // Filter logs for selected month
            val monthLogs = logs.filter { log ->
                val cal = java.util.Calendar.getInstance().apply { timeInMillis = log.timestamp }
                cal.get(java.util.Calendar.YEAR) == calendarState.selectedYear &&
                        cal.get(java.util.Calendar.MONTH) == calendarState.selectedMonth
            }

            val realLogsGross = monthLogs.sumOf { it.walksIncome + it.rappiIncome }
            val realLogsExpenses = monthLogs.sumOf { it.dailyExpense }
            val realLogsNet = monthLogs.sumOf { it.netChange }

            // Project $35,000 COP for Mondays in future dates without logs
            val todayCal = java.util.Calendar.getInstance()
            val calMonth = java.util.Calendar.getInstance().apply {
                set(java.util.Calendar.YEAR, calendarState.selectedYear)
                set(java.util.Calendar.MONTH, calendarState.selectedMonth)
                set(java.util.Calendar.DAY_OF_MONTH, 1)
            }
            val daysInMonth = calMonth.getActualMaximum(java.util.Calendar.DAY_OF_MONTH)
            var projectedMondaysIncome = 0.0

            for (d in 1..daysInMonth) {
                val dCal = java.util.Calendar.getInstance().apply {
                    set(java.util.Calendar.YEAR, calendarState.selectedYear)
                    set(java.util.Calendar.MONTH, calendarState.selectedMonth)
                    set(java.util.Calendar.DAY_OF_MONTH, d)
                }
                val isFutureDay = (calendarState.selectedYear > todayCal.get(java.util.Calendar.YEAR)) ||
                        (calendarState.selectedYear == todayCal.get(java.util.Calendar.YEAR) && calendarState.selectedMonth > todayCal.get(java.util.Calendar.MONTH)) ||
                        (calendarState.selectedYear == todayCal.get(java.util.Calendar.YEAR) && calendarState.selectedMonth == todayCal.get(java.util.Calendar.MONTH) && d >= todayCal.get(java.util.Calendar.DAY_OF_MONTH))

                val hasLog = monthLogs.any { log ->
                    val c = java.util.Calendar.getInstance().apply { timeInMillis = log.timestamp }
                    c.get(java.util.Calendar.DAY_OF_MONTH) == d
                }

                if (isFutureDay && !hasLog && dCal.get(java.util.Calendar.DAY_OF_WEEK) == java.util.Calendar.MONDAY) {
                    projectedMondaysIncome += 35000.0
                }
            }

            val monthlyGross = realLogsGross + projectedMondaysIncome
            val monthlyExpenses = realLogsExpenses
            val monthlyNet = realLogsNet + projectedMondaysIncome

            val isFutureMonth = (calendarState.selectedYear > todayCal.get(java.util.Calendar.YEAR)) ||
                    (calendarState.selectedYear == todayCal.get(java.util.Calendar.YEAR) && calendarState.selectedMonth > todayCal.get(java.util.Calendar.MONTH))

            val weeklyGross = if (isFutureMonth) {
                35000.0 // Proyección semanal de aporte papá
            } else {
                val calCurrentWeek = java.util.Calendar.getInstance().apply { add(java.util.Calendar.DAY_OF_YEAR, -7) }
                logs.filter { it.timestamp >= calCurrentWeek.timeInMillis }
                    .sumOf { it.walksIncome + it.rappiIncome }
            }

            val monthNames = arrayOf(
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            )
            val monthName = "${monthNames.getOrElse(calendarState.selectedMonth) { "Mes" }} ${calendarState.selectedYear}"

            val context = FinancialContext(
                accounts = dash.accounts,
                fixedExpenses = dash.fixedExpenses,
                totalBalances = dash.totalBalances,
                totalDebts = dash.totalDebtsAndExpenses,
                excedenteLiquido = dash.excedenteLiquidoLibre,
                medellinAvailableFund = med.availableFund,
                medellinTotalCost = med.totalEstimatedCost,
                tripItems = med.tripItems,
                recentLogs = logs,
                dadTotalCommitted = med.dadTotalCommitted,
                dadPaidAmount = med.dadPaidAmount,
                dadPendingAmount = med.dadPendingAmount
            )

            val result = GeminiClient.generateMonthlyCalendarReport(
                context = context,
                monthName = monthName,
                monthlyGrossIncome = monthlyGross,
                monthlyNetIncome = monthlyNet,
                monthlyExpenses = monthlyExpenses,
                weeklyIncome = weeklyGross
            )

            val report = result.getOrElse { "No se pudo generar el reporte en este momento." }

            _calendarReportsUiState.update {
                it.copy(
                    isGeneratingReport = false,
                    geminiReportText = report
                )
            }
            _userMessage.emit("✨ ¡Reporte Gemini generado con éxito!")
        }
    }

    // ----------------------------------------------------
    // Actions: Recordatorio Diario (Notificaciones)
    // ----------------------------------------------------
    fun toggleNotifications(context: Context, enabled: Boolean) {
        NotificationHelper.setNotificationEnabled(context, enabled)
        _geminiAdvisorState.update { it.copy(notificationsEnabled = enabled) }
        viewModelScope.launch(Dispatchers.IO) {
            if (enabled) {
                _userMessage.emit("🔔 Recordatorio diario activado para las ${String.format(Locale("es", "CO"), "%02d:%02d", _geminiAdvisorState.value.reminderHour, _geminiAdvisorState.value.reminderMinute)}")
            } else {
                _userMessage.emit("🔕 Recordatorio diario desactivado")
            }
        }
    }

    fun updateReminderTime(context: Context, hour: Int, minute: Int) {
        NotificationHelper.setReminderTime(context, hour, minute)
        _geminiAdvisorState.update {
            it.copy(reminderHour = hour, reminderMinute = minute)
        }
        viewModelScope.launch(Dispatchers.IO) {
            _userMessage.emit("Hora del recordatorio configurada: ${String.format(Locale("es", "CO"), "%02d:%02d", hour, minute)}")
        }
    }

    fun sendTestNotification(context: Context) {
        NotificationHelper.showReminderNotification(context)
        viewModelScope.launch(Dispatchers.IO) {
            _userMessage.emit("Notificación de prueba enviada")
        }
    }
}
