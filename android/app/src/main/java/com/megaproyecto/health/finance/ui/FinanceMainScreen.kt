package com.megaproyecto.health.finance.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.megaproyecto.health.finance.ui.screens.CalendarReportsScreen
import com.megaproyecto.health.finance.ui.screens.DailyRegisterScreen
import com.megaproyecto.health.finance.ui.screens.DashboardScreen
import com.megaproyecto.health.finance.ui.screens.GeminiAdvisorScreen
import com.megaproyecto.health.finance.ui.screens.MedellinSimulatorScreen
import com.megaproyecto.health.finance.ui.theme.CardBorder
import com.megaproyecto.health.finance.ui.theme.DarkBackground
import com.megaproyecto.health.finance.ui.theme.DarkSurface
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceElevated
import com.megaproyecto.health.finance.ui.theme.HighDensityLavender
import com.megaproyecto.health.finance.ui.theme.TextSecondary
import com.megaproyecto.health.finance.ui.theme.TextTertiary
import com.megaproyecto.health.finance.viewmodel.FinanceViewModel
import kotlinx.coroutines.flow.collectLatest

sealed class ScreenTab(
    val route: String,
    val title: String,
    val emoji: String,
    val tag: String
) {
    object Dashboard : ScreenTab(
        route = "dashboard",
        title = "Inventario",
        emoji = "🪙",
        tag = "nav_tab_dashboard"
    )

    object DailyRegister : ScreenTab(
        route = "daily_register",
        title = "Registro",
        emoji = "📜",
        tag = "nav_tab_daily_register"
    )

    object MedellinSimulator : ScreenTab(
        route = "medellin_simulator",
        title = "Medellín",
        emoji = "🏰",
        tag = "nav_tab_medellin_simulator"
    )

    object CalendarReports : ScreenTab(
        route = "calendar_reports",
        title = "Grimorio",
        emoji = "📅",
        tag = "nav_tab_calendar_reports"
    )

    object GeminiAdvisor : ScreenTab(
        route = "gemini_advisor",
        title = "Oráculo",
        emoji = "🔮",
        tag = "nav_tab_gemini_advisor"
    )
}

@Composable
fun FinanceMainScreen(
    initialTabIndex: Int = 0,
    viewModel: FinanceViewModel = viewModel()
) {
    val context = LocalContext.current
    var selectedTabIndex by remember { mutableIntStateOf(initialTabIndex) }

    LaunchedEffect(initialTabIndex) {
        selectedTabIndex = initialTabIndex
    }

    val tabs = listOf(
        ScreenTab.Dashboard,
        ScreenTab.DailyRegister,
        ScreenTab.MedellinSimulator,
        ScreenTab.CalendarReports,
        ScreenTab.GeminiAdvisor
    )

    val dashboardState by viewModel.dashboardUiState.collectAsStateWithLifecycle()
    val dailyFormState by viewModel.dailyFormState.collectAsStateWithLifecycle()
    val dailyLogs by viewModel.dailyLogs.collectAsStateWithLifecycle()
    val pendingDebts by viewModel.pendingDebts.collectAsStateWithLifecycle()
    val pendingWalksWeekly by viewModel.pendingWalksWeekly.collectAsStateWithLifecycle()
    val medellinState by viewModel.medellinUiState.collectAsStateWithLifecycle()
    val calendarState by viewModel.calendarReportsUiState.collectAsStateWithLifecycle()
    val advisorState by viewModel.geminiAdvisorState.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        viewModel.userMessage.collectLatest { message ->
            snackbarHostState.showSnackbar(message)
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground),
        containerColor = DarkBackground,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            Surface(
                color = DarkSurface,
                shape = RectangleShape,
                border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
            ) {
                NavigationBar(
                    modifier = Modifier.testTag("finance_bottom_navigation_bar"),
                    containerColor = DarkSurface,
                    tonalElevation = 0.dp
                ) {
                    tabs.forEachIndexed { index, tab ->
                        val isSelected = selectedTabIndex == index
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = { selectedTabIndex = index },
                            icon = {
                                Text(
                                    text = tab.emoji,
                                    fontSize = 18.sp
                                )
                            },
                            label = {
                                Text(
                                    text = tab.title,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 10.sp
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = HighDensityLavender,
                                selectedTextColor = HighDensityLavender,
                                unselectedIconColor = TextTertiary,
                                unselectedTextColor = TextSecondary,
                                indicatorColor = DarkSurfaceElevated
                            ),
                            modifier = Modifier.testTag(tab.tag)
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            AnimatedContent(
                targetState = selectedTabIndex,
                transitionSpec = {
                    fadeIn(animationSpec = tween(200)) togetherWith fadeOut(animationSpec = tween(150))
                },
                label = "ScreenTabTransition"
            ) { tabIndex ->
                when (tabIndex) {
                    0 -> DashboardScreen(
                        state = dashboardState,
                        onUpdateAccountBalance = { name, amount ->
                            viewModel.updateAccountBalance(name, amount)
                        },
                        onAddExpense = { title, amount, category ->
                            viewModel.addFixedExpense(title, amount, category)
                        },
                        onUpdateExpense = { id, title, amount, category ->
                            viewModel.updateFixedExpense(id, title, amount, category)
                        },
                        onDeleteExpense = { id, title ->
                            viewModel.deleteFixedExpense(id, title)
                        },
                        onConsultGemini = { selectedTabIndex = 4 },
                        userEmail = "santiagosmitttt@gmail.com",
                        onSignOut = {}
                    )

                    1 -> DailyRegisterScreen(
                        state = dailyFormState,
                        dailyLogs = dailyLogs,
                        pendingDebts = pendingDebts,
                        pendingWalksWeekly = pendingWalksWeekly,
                        onSettleWeeklyWalks = { viewModel.settleWeeklyWalks(it) },
                        onToggleSienna = { viewModel.toggleSiennaWalk() },
                        onToggleFrida = { viewModel.toggleFridaWalk() },
                        onToggleMolly = {},
                        onUpdateRappi = { viewModel.updateRappiInput(it) },
                        onAddQuickRappi = { viewModel.addQuickRappiAmount(it) },
                        onUpdateExpense = { viewModel.updateExpenseInput(it) },
                        onUpdateNote = { viewModel.updateExpenseNote(it) },
                        onSelectAccount = { viewModel.selectTargetAccount(it) },
                        onSaveDay = { viewModel.saveDayRecord() },
                        onDeleteLog = { viewModel.deleteDailyLog(it) },
                        onAddPendingDebt = { name, amount, description ->
                            viewModel.addPendingDebt(name, amount, description)
                        },
                        onSettlePendingDebt = { debt, targetAccount ->
                            viewModel.settlePendingDebt(debt, targetAccount)
                        },
                        onDeletePendingDebt = { debt ->
                            viewModel.deletePendingDebt(debt)
                        }
                    )

                    2 -> MedellinSimulatorScreen(
                        state = medellinState,
                        excedenteLiquidoActual = dashboardState.excedenteLiquidoLibre,
                        accounts = dashboardState.accounts,
                        dailyLogs = dailyLogs,
                        onUpdateFund = { viewModel.updateMedellinFund(it) },
                        onSyncWithExcedente = { viewModel.syncFundWithExcedente(it) },
                        onUpdateDadContribution = { totalCommitted, paidAmount ->
                            viewModel.updateDadContribution(totalCommitted, paidAmount)
                        },
                        onRegisterDadAbono = { amount, targetAccount ->
                            viewModel.registerDadAbono(amount, targetAccount)
                        },
                        onConsultGemini = { selectedTabIndex = 4 }
                    )

                    3 -> CalendarReportsScreen(
                        state = calendarState,
                        dailyLogs = dailyLogs,
                        onPreviousMonth = { viewModel.changeCalendarMonth(-1) },
                        onNextMonth = { viewModel.changeCalendarMonth(1) },
                        onResetToToday = { viewModel.resetCalendarToToday() },
                        onSelectDay = { viewModel.selectCalendarDay(it) },
                        onGenerateGeminiReport = { viewModel.generateCalendarGeminiReport() }
                    )

                    4 -> GeminiAdvisorScreen(
                        advisorState = advisorState,
                        dashboardState = dashboardState,
                        medellinState = medellinState,
                        onRunAnalysis = { query -> viewModel.runGeminiAnalysis(query) },
                        onUpdateCustomQuery = { query -> viewModel.updateCustomQuery(query) },
                        onToggleNotifications = { enabled -> viewModel.toggleNotifications(context, enabled) },
                        onUpdateReminderTime = { hour, minute -> viewModel.updateReminderTime(context, hour, minute) },
                        onSendTestNotification = { viewModel.sendTestNotification(context) }
                    )
                }
            }
        }
    }
}
