package com.megaproyecto.health.finance.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.megaproyecto.health.finance.data.model.AccountBalance
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.data.model.FixedExpense
import com.megaproyecto.health.finance.data.model.PendingDebt
import com.megaproyecto.health.finance.data.model.TripSettings
import kotlinx.coroutines.flow.Flow

@Dao
interface AppDao {
    // Accounts
    @Query("SELECT * FROM accounts ORDER BY id ASC")
    fun getAllAccounts(): Flow<List<AccountBalance>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAccounts(accounts: List<AccountBalance>)

    @Update
    suspend fun updateAccount(account: AccountBalance)

    @Query("UPDATE accounts SET balance = :newBalance WHERE name = :accountName")
    suspend fun updateAccountBalanceByName(accountName: String, newBalance: Double)

    @Query("UPDATE accounts SET balance = balance + :amount WHERE name = :accountName")
    suspend fun addToAccountBalance(accountName: String, amount: Double)

    // Fixed Expenses & Debts
    @Query("SELECT * FROM fixed_expenses ORDER BY id ASC")
    fun getAllFixedExpenses(): Flow<List<FixedExpense>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFixedExpense(expense: FixedExpense): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFixedExpenses(expenses: List<FixedExpense>)

    @Update
    suspend fun updateFixedExpense(expense: FixedExpense)

    @Query("DELETE FROM fixed_expenses WHERE id = :id")
    suspend fun deleteFixedExpenseById(id: Int)

    @Query("DELETE FROM fixed_expenses")
    suspend fun clearFixedExpenses()

    // Daily Logs
    @Query("SELECT * FROM daily_logs ORDER BY timestamp DESC")
    fun getAllDailyLogs(): Flow<List<DailyLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDailyLog(log: DailyLog): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDailyLogs(logs: List<DailyLog>)

    @Query("DELETE FROM daily_logs WHERE id = :id")
    suspend fun deleteDailyLogById(id: Int)

    // Trip Settings
    @Query("SELECT * FROM trip_settings WHERE id = 1")
    fun getTripSettings(): Flow<TripSettings?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveTripSettings(settings: TripSettings)

    @Query("UPDATE trip_settings SET pendingWalksWeekly = pendingWalksWeekly + :amount WHERE id = 1")
    suspend fun addPendingWalksWeekly(amount: Double)

    @Query("UPDATE trip_settings SET pendingWalksWeekly = 0.0 WHERE id = 1")
    suspend fun resetPendingWalksWeekly()

    @Query("UPDATE trip_settings SET pendingWalksWeekly = :amount WHERE id = 1")
    suspend fun setPendingWalksWeekly(amount: Double)

    // Pending Debts (Gente que me debe plata)
    @Query("SELECT * FROM pending_debts WHERE isPaid = 0 ORDER BY id DESC")
    fun getActivePendingDebts(): Flow<List<PendingDebt>>

    @Query("SELECT * FROM pending_debts ORDER BY id DESC")
    fun getAllPendingDebts(): Flow<List<PendingDebt>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPendingDebt(debt: PendingDebt): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPendingDebts(debts: List<PendingDebt>)

    @Update
    suspend fun updatePendingDebt(debt: PendingDebt)

    @Query("DELETE FROM pending_debts WHERE id = :id")
    suspend fun deletePendingDebtById(id: Int)
}
