package com.megaproyecto.health.finance.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.megaproyecto.health.finance.data.model.AccountBalance
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.data.model.FixedExpense
import com.megaproyecto.health.finance.data.model.PendingDebt
import com.megaproyecto.health.finance.data.model.TripSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        AccountBalance::class,
        FixedExpense::class,
        DailyLog::class,
        TripSettings::class,
        PendingDebt::class
    ],
    version = 4,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun appDao(): AppDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE trip_settings ADD COLUMN pendingWalksWeekly REAL NOT NULL DEFAULT 48700.0")
            }
        }

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "finanzas_viaje_db"
                ).addMigrations(MIGRATION_3_4)
                .fallbackToDestructiveMigration()
                .addCallback(object : Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        // Pre-populate defaults in background
                        CoroutineScope(Dispatchers.IO).launch {
                            val dao = getDatabase(context).appDao()
                            prepopulateData(dao)
                        }
                    }
                }).build()
                INSTANCE = instance
                instance
            }
        }

        private suspend fun prepopulateData(dao: AppDao) {
            dao.insertAccounts(
                listOf(
                    AccountBalance(name = "Efectivo", balance = 85000.0, type = "CASH"),
                    AccountBalance(name = "Cuenta Nu", balance = 320000.0, type = "NU"),
                    AccountBalance(name = "Nequi", balance = 245000.0, type = "NEQUI")
                )
            )

            dao.insertFixedExpenses(
                listOf(
                    FixedExpense(title = "Vuelos", amount = 140000.0, category = "DEBT"),
                    FixedExpense(title = "Suscripciones (Spotify/Crunchyroll)", amount = 10200.0, category = "SUBSCRIPTION"),
                    FixedExpense(title = "Motilada", amount = 25000.0, category = "GENERAL")
                )
            )

            dao.saveTripSettings(
                TripSettings(
                    id = 1,
                    availableFund = 550000.0,
                    dadTotalCommitted = 450000.0,
                    dadPaidAmount = 140000.0,
                    pendingWalksWeekly = 48700.0
                )
            )

            dao.insertPendingDebts(
                listOf(
                    PendingDebt(
                        debtorName = "Camilo",
                        amount = 35000.0,
                        description = "Préstamo salida fin de semana",
                        dateCreated = "28 de agosto, 2026",
                        isPaid = false
                    ),
                    PendingDebt(
                        debtorName = "Mateo",
                        amount = 20000.0,
                        description = "Mitad de la cuenta del almuerzo",
                        dateCreated = "30 de agosto, 2026",
                        isPaid = false
                    )
                )
            )

            // Pre-seed representative daily logs for August 2026 (Molly purged/false)
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
    }
}
