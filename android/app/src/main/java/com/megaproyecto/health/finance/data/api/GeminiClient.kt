package com.megaproyecto.health.finance.data.api

import com.megaproyecto.health.BuildConfig
import com.megaproyecto.health.finance.data.model.AccountBalance
import com.megaproyecto.health.finance.data.model.DailyLog
import com.megaproyecto.health.finance.data.model.FixedExpense
import com.megaproyecto.health.finance.data.model.TripFixedItem
import com.megaproyecto.health.finance.util.CurrencyUtils
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

@JsonClass(generateAdapter = true)
data class GeminiApiRequest(
    val contents: List<GeminiContent>,
    val systemInstruction: GeminiContent? = null,
    val generationConfig: GeminiGenerationConfig? = null
)

@JsonClass(generateAdapter = true)
data class GeminiContent(
    val role: String = "user",
    val parts: List<GeminiPart>
)

@JsonClass(generateAdapter = true)
data class GeminiPart(
    val text: String
)

@JsonClass(generateAdapter = true)
data class GeminiGenerationConfig(
    val temperature: Float = 0.7f,
    val topP: Float = 0.95f,
    val topK: Int = 40
)

@JsonClass(generateAdapter = true)
data class GeminiApiResponse(
    val candidates: List<GeminiCandidate>? = null,
    val error: GeminiError? = null
)

@JsonClass(generateAdapter = true)
data class GeminiCandidate(
    val content: GeminiContent? = null
)

@JsonClass(generateAdapter = true)
data class GeminiError(
    val code: Int? = null,
    val message: String? = null,
    val status: String? = null
)

data class FinancialContext(
    val accounts: List<AccountBalance>,
    val fixedExpenses: List<FixedExpense>,
    val totalBalances: Double,
    val totalDebts: Double,
    val excedenteLiquido: Double,
    val medellinAvailableFund: Double,
    val medellinTotalCost: Double,
    val tripItems: List<TripFixedItem>,
    val recentLogs: List<DailyLog>,
    val dadTotalCommitted: Double = 450000.0,
    val dadPaidAmount: Double = 140000.0,
    val dadPendingAmount: Double = 310000.0
)

object GeminiClient {

    private const val MODEL_NAME = "gemini-3.5-flash"
    private const val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    private val requestAdapter = moshi.adapter(GeminiApiRequest::class.java)
    private val responseAdapter = moshi.adapter(GeminiApiResponse::class.java)

    suspend fun analyzeTripViability(
        context: FinancialContext,
        customQuery: String? = null
    ): Result<String> = withContext(Dispatchers.IO) {
        val apiKey = try {
            BuildConfig::class.java.getField("GEMINI_API_KEY").get(null) as? String ?: ""
        } catch (e: Exception) {
            ""
        }

        val systemInstructionText = """
            Eres el Asesor Financiero Inteligente y Mentor de Viaje a Medellín para Santiago.
            Hablas con un tono motivador, honesto, perspicaz y profesional, con expresiones naturales de Colombia (como 'parce', 'vamos con toda', 'ojo con', 'meta clara').
            
            Tu objetivo principal:
            1. Evaluar si Santiago VA BIEN, AJUSTADO o SOBRADO para su viaje a Medellín teniendo en cuenta sus saldos, deudas y especialmente el ABONO DE SU PAPÁ.
               - Su papá le comprometió ${CurrencyUtils.formatCOP(context.dadTotalCommitted)} para el viaje.
               - Su papá ya le abonó ${CurrencyUtils.formatCOP(context.dadPaidAmount)}.
               - Su papá le tiene que dar todavía ${CurrencyUtils.formatCOP(context.dadPendingAmount)}.
               - Al cubrir su papá $450.000, el esfuerzo propio restante de Santiago para cubrir todo Medellín ($584.549) es de solo ~$134.549 COP!
            2. Dar una respuesta estructurada y muy clara:
               - 🎯 Veredicto de Viabilidad: Estado actual claro (¿Vas bien o mal?).
               - 👨‍👦 Abono de Papá & Pronóstico Real: Detallar lo recibido, lo que falta ($310.000) y cómo esto asegura el viaje.
               - 💰 Radiografía Financiera: Excedente líquido, meta Medellín y balance proyectado.
               - 🐾 Plan de Acción de Ingresos: Paseos de perros (Sienna: $9.000 COP, Frida: $5.850 COP) y Rappi.
               - 💡 Consejos Clave: Tips estratégicos.
            
            Sé conciso, directo, realista y estructurado.
        """.trimIndent()

        val accountsSummary = context.accounts.joinToString(", ") { "${it.name}: ${CurrencyUtils.formatCOP(it.balance)}" }
        val debtsSummary = context.fixedExpenses.joinToString(", ") { "${it.title}: ${CurrencyUtils.formatCOP(it.amount)} (${it.category})" }
        val tripItemsSummary = context.tripItems.joinToString(", ") { "${it.title}: ${CurrencyUtils.formatCOP(it.amount)}" }
        val recentLogsSummary = if (context.recentLogs.isNotEmpty()) {
            context.recentLogs.take(5).joinToString("; ") {
                val totalLogIncome = it.walksIncome + it.rappiIncome
                "${it.dateDisplay}: Ingresos ${CurrencyUtils.formatCOP(totalLogIncome)}, Gastos ${CurrencyUtils.formatCOP(it.dailyExpense)} (${it.note.ifBlank { "Sin nota" }})"
            }
        } else {
            "Sin registros recientes aún"
        }

        val personalTarget = (context.medellinTotalCost - context.dadTotalCommitted).coerceAtLeast(0.0)
        val projectedWithDad = context.medellinAvailableFund + context.dadPendingAmount

        val userPrompt = """
            DATOS FINANCIEROS ACTUALES:
            - Saldos en Cuentas ($accountsSummary). Total: ${CurrencyUtils.formatCOP(context.totalBalances)}
            - Deudas y Gastos Fijos ($debtsSummary). Total: ${CurrencyUtils.formatCOP(context.totalDebts)}
            - Excedente Líquido Libre: ${CurrencyUtils.formatCOP(context.excedenteLiquido)}
            - Meta Presupuesto Medellín: ${CurrencyUtils.formatCOP(context.medellinTotalCost)} (Rubros: $tripItemsSummary)
            - Fondo Asignado Actual: ${CurrencyUtils.formatCOP(context.medellinAvailableFund)}
            - ABONO DE PAPÁ:
              • Comprometido: ${CurrencyUtils.formatCOP(context.dadTotalCommitted)}
              • Ya abonado: ${CurrencyUtils.formatCOP(context.dadPaidAmount)}
              • Pendiente por entregarte: ${CurrencyUtils.formatCOP(context.dadPendingAmount)}
              • Cuota personal final de Santiago: ${CurrencyUtils.formatCOP(personalTarget)}
              • Pronóstico total al sumar el abono pendiente de papá: ${CurrencyUtils.formatCOP(projectedWithDad)}
            - Tarifas de Paseos de Perros: Sienna = $9.000 COP, Frida = $5.850 COP (Día completo de 2 paseos = $14.850 COP).
            - Registro reciente: $recentLogsSummary
            
            ${if (customQuery.isNullOrBlank()) "Realiza un diagnóstico financiero completo: ¿Voy bien para el viaje a Medellín con el abono de mi papá y mis paseos? ¿Cuánto me tiene que dar mi papá y cuál es el pronóstico de mi viaje?" else "Pregunta específica del usuario: $customQuery"}
        """.trimIndent()

        if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY" || apiKey.contains("PLACEHOLDER", ignoreCase = true)) {
            // Provide high-quality local intelligent fallback analysis
            return@withContext Result.success(generateLocalIntelligentAnalysis(context, customQuery))
        }

        val requestPayload = GeminiApiRequest(
            contents = listOf(
                GeminiContent(
                    role = "user",
                    parts = listOf(GeminiPart(text = userPrompt))
                )
            ),
            systemInstruction = GeminiContent(
                role = "system",
                parts = listOf(GeminiPart(text = systemInstructionText))
            ),
            generationConfig = GeminiGenerationConfig(
                temperature = 0.7f,
                topP = 0.95f,
                topK = 40
            )
        )

        try {
            val jsonBody = requestAdapter.toJson(requestPayload)
            val requestBody = jsonBody.toRequestBody("application/json".toMediaType())

            val url = "$BASE_URL/$MODEL_NAME:generateContent?key=$apiKey"
            val request = Request.Builder()
                .url(url)
                .post(requestBody)
                .build()

            val response = okHttpClient.newCall(request).execute()
            val responseBodyString = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                val localAnalysis = generateLocalIntelligentAnalysis(context, customQuery)
                return@withContext Result.success(localAnalysis)
            }

            val parsedResponse = responseAdapter.fromJson(responseBodyString)
            val responseText = parsedResponse?.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text

            if (responseText.isNullOrBlank()) {
                val localFallback = generateLocalIntelligentAnalysis(context, customQuery)
                return@withContext Result.success(localFallback)
            }

            Result.success(responseText)
        } catch (e: Exception) {
            val localFallback = generateLocalIntelligentAnalysis(context, customQuery)
            Result.success(localFallback)
        }
    }

    private fun generateLocalIntelligentAnalysis(
        context: FinancialContext,
        customQuery: String?
    ): String {
        val totalCost = context.medellinTotalCost
        val fund = context.medellinAvailableFund
        val dadCommitted = context.dadTotalCommitted
        val dadPaid = context.dadPaidAmount
        val dadPending = context.dadPendingAmount
        val personalTarget = (totalCost - dadCommitted).coerceAtLeast(0.0)

        val projectedFundWithDad = fund + dadPending
        val projectedSurplus = projectedFundWithDad - totalCost
        val isProjectedPositive = projectedSurplus >= 0

        val fullDayWalksIncome = 9000.0 + 5850.0 // $14.850 COP (Sienna + Frida)
        val personalGap = (personalTarget - context.excedenteLiquido).coerceAtLeast(0.0)
        val siennaWalksNeeded = if (personalGap > 0) kotlin.math.ceil(personalGap / 9000.0).toInt() else 0
        val fullDaysWalksNeeded = if (personalGap > 0) kotlin.math.ceil(personalGap / fullDayWalksIncome).toInt() else 0

        val statusVerdict = if (isProjectedPositive) {
            "🟢 Veredicto de Viabilidad: **¡EXCELENTE PRONÓSTICO!** 🚀"
        } else {
            "🟡 Veredicto de Viabilidad: **BUEN CAMINO - AJUSTADO** ⚠️"
        }

        val verdictExplanation = if (isProjectedPositive) {
            "¡El pronóstico de tu viaje es sumamente favorable! Al sumar tu excedente actual (${CurrencyUtils.formatCOP(context.excedenteLiquido)}) con los **${CurrencyUtils.formatCOP(dadPending)}** que tu papá te tiene pendientes por entregar, alcanzarás un fondo total de **${CurrencyUtils.formatCOP(projectedFundWithDad)}**, lo que cubre al 100% el presupuesto de Medellín (${CurrencyUtils.formatCOP(totalCost)}) y te deja un sobrante de **+${CurrencyUtils.formatCOP(projectedSurplus)}** para planes y gastronomía."
        } else {
            "Vas por muy buen camino. Gracias a los **${CurrencyUtils.formatCOP(dadCommitted)}** comprometidos por tu papá, tu meta personal para el viaje es de solo **${CurrencyUtils.formatCOP(personalTarget)}**. Tu papá te ha abonado **${CurrencyUtils.formatCOP(dadPaid)}** y le falta por darte **${CurrencyUtils.formatCOP(dadPending)}**."
        }

        val dadBreakdown = """
            👨‍👦 **Abono de tu Papá (Meta: ${CurrencyUtils.formatCOP(dadCommitted)}):**
            • **Total Comprometido por tu Papá:** ${CurrencyUtils.formatCOP(dadCommitted)}
            • **Ya Abonado / Recibido:** ${CurrencyUtils.formatCOP(dadPaid)} (${((dadPaid / dadCommitted) * 100).toInt()}% completado)
            • **FALTA POR ENTREGARTE:** **${CurrencyUtils.formatCOP(dadPending)}**
            • **Tu Aporte Personal Real:** Con los $450.000 de tu papá, a ti solo te toca poner **${CurrencyUtils.formatCOP(personalTarget)}** para todo el viaje a Medellín.
        """.trimIndent()

        val planDeAccion = if (personalGap > 0) {
            """
            🐾 **Plan de Acción para Cubrir tu Cuota Personal (${CurrencyUtils.formatCOP(personalGap)}):**
            • **Paseos de Perros:** Con **solo $fullDaysWalksNeeded días completos de paseos** (Sienna + Frida = $14.850/día) cubres tu cuota restante.
            • **Solo Sienna:** O con **$siennaWalksNeeded paseos de Sienna** ($9.000 c/u) llegas a la meta con tranquilidad.
            • **Turnos de Rappi:** Un solo turno extra (~$45.000) liquida la diferencia al instante.
            """.trimIndent()
        } else {
            """
            🐾 **Plan de Acción de Ingresos:**
            • ¡Tu cuota personal (${CurrencyUtils.formatCOP(personalTarget)}) ya está cubierta con tu excedente líquido disponible!
            • Cada paseo adicional de **Sienna ($9.000)** o **Frida ($5.850)** aumentará tu bolsillo libre en Medellín para restaurantes y actividades.
            """.trimIndent()
        }

        return """
            $statusVerdict
            
            $verdictExplanation
            
            ---
            
            $dadBreakdown
            
            ---
            
            📊 **Radiografía Financiera del Viaje:**
            • **Presupuesto Total Estimado:** ${CurrencyUtils.formatCOP(totalCost)}
            • **Excedente Líquido en Cuentas:** ${CurrencyUtils.formatCOP(context.excedenteLiquido)}
            • **Abono Pendiente de Papá:** ${CurrencyUtils.formatCOP(dadPending)}
            • **Pronóstico Proyectado con Papá:** ${CurrencyUtils.formatCOP(projectedFundWithDad)} (${if (isProjectedPositive) "Superávit +${CurrencyUtils.formatCOP(projectedSurplus)}" else "Déficit -${CurrencyUtils.formatCOP(-projectedSurplus)}"})
            
            ---
            
            $planDeAccion
            
            ---
            
            💡 **Recomendaciones Clave:**
            1. **Cobro del abono pendiente:** Tu papá te debe **${CurrencyUtils.formatCOP(dadPending)}**. Apenas te transfiera, regístralo en la app para sumarlo a tu saldo.
            2. **Blindar el dinero en Cuenta Nu:** Mantén el fondo del viaje generando rendimientos para que no se mezcle con gastos cotidianos.
            3. **Continuidad de paseos:** Los paseos de Sienna y Frida garantizan flujo de caja constante cada semana.
        """.trimIndent()
    }

    suspend fun generateMonthlyCalendarReport(
        context: FinancialContext,
        monthName: String,
        monthlyGrossIncome: Double,
        monthlyNetIncome: Double,
        monthlyExpenses: Double,
        weeklyIncome: Double
    ): Result<String> = withContext(Dispatchers.IO) {
        val apiKey = try {
            BuildConfig::class.java.getField("GEMINI_API_KEY").get(null) as? String ?: ""
        } catch (e: Exception) {
            ""
        }

        val systemInstructionText = """
            Eres el Asesor Financiero Gemini para Santiago. Genera un reporte mensual estructurado exactamente con estas dos secciones obligatorias:
            1. **Balance del Mes**: Resumen claro de ingresos generados (paseos de perros y Rappi) vs gastos fijos (Suscripciones, motilada, vuelos).
            2. **Proyección del Siguiente Mes**: Predicción de cómo le irá el mes entrante respecto a su meta de ahorro para el viaje a Medellín, dándole ánimos positivos, cálculo con el aporte de su papá y alertas tempranas si se requieren.
            
            Usa un tono profesional, motivador, cálido y directo con formato Markdown elegante.
        """.trimIndent()

        val fixedExpensesList = context.fixedExpenses.joinToString(", ") { "${it.title}: ${CurrencyUtils.formatCOP(it.amount)}" }
        val userPrompt = """
            Genera el Reporte Mensual Inteligente para el mes de $monthName:
            - Ganancia Acumulada del Mes (Paseos + Rappi): ${CurrencyUtils.formatCOP(monthlyGrossIncome)}
            - Ganancia Semanal Reciente: ${CurrencyUtils.formatCOP(weeklyIncome)}
            - Gastos Registrados en el Mes: ${CurrencyUtils.formatCOP(monthlyExpenses)}
            - Gastos Fijos Mensuales: ${CurrencyUtils.formatCOP(context.totalDebts)} ($fixedExpensesList)
            - Balance Neto del Mes: ${CurrencyUtils.formatCOP(monthlyNetIncome)}
            - Saldos Actuales en Cuentas: ${CurrencyUtils.formatCOP(context.totalBalances)} (Excedente Líquido Libre: ${CurrencyUtils.formatCOP(context.excedenteLiquido)})
            - Meta Presupuesto Viaje Medellín: ${CurrencyUtils.formatCOP(context.medellinTotalCost)}
            - Abono de Papá: Comprometido ${CurrencyUtils.formatCOP(context.dadTotalCommitted)}, Ya entregado ${CurrencyUtils.formatCOP(context.dadPaidAmount)}, Pendiente por entregar ${CurrencyUtils.formatCOP(context.dadPendingAmount)}
            - Cuota personal restante de Santiago para Medellín: ${CurrencyUtils.formatCOP((context.medellinTotalCost - context.dadTotalCommitted).coerceAtLeast(0.0))}
        """.trimIndent()

        if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY" || apiKey.contains("PLACEHOLDER", ignoreCase = true)) {
            return@withContext Result.success(
                generateLocalMonthlyReport(
                    context = context,
                    monthName = monthName,
                    monthlyGrossIncome = monthlyGrossIncome,
                    monthlyNetIncome = monthlyNetIncome,
                    monthlyExpenses = monthlyExpenses,
                    weeklyIncome = weeklyIncome
                )
            )
        }

        val requestPayload = GeminiApiRequest(
            contents = listOf(
                GeminiContent(
                    role = "user",
                    parts = listOf(GeminiPart(text = userPrompt))
                )
            ),
            systemInstruction = GeminiContent(
                role = "system",
                parts = listOf(GeminiPart(text = systemInstructionText))
            ),
            generationConfig = GeminiGenerationConfig(
                temperature = 0.7f,
                topP = 0.95f,
                topK = 40
            )
        )

        try {
            val jsonBody = requestAdapter.toJson(requestPayload)
            val requestBody = jsonBody.toRequestBody("application/json".toMediaType())
            val url = "$BASE_URL/$MODEL_NAME:generateContent?key=$apiKey"
            val request = Request.Builder().url(url).post(requestBody).build()
            val response = okHttpClient.newCall(request).execute()
            val responseBodyString = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                return@withContext Result.success(
                    generateLocalMonthlyReport(context, monthName, monthlyGrossIncome, monthlyNetIncome, monthlyExpenses, weeklyIncome)
                )
            }

            val parsedResponse = responseAdapter.fromJson(responseBodyString)
            val responseText = parsedResponse?.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text

            if (responseText.isNullOrBlank()) {
                return@withContext Result.success(
                    generateLocalMonthlyReport(context, monthName, monthlyGrossIncome, monthlyNetIncome, monthlyExpenses, weeklyIncome)
                )
            }

            Result.success(responseText)
        } catch (e: Exception) {
            Result.success(
                generateLocalMonthlyReport(context, monthName, monthlyGrossIncome, monthlyNetIncome, monthlyExpenses, weeklyIncome)
            )
        }
    }

    private fun generateLocalMonthlyReport(
        context: FinancialContext,
        monthName: String,
        monthlyGrossIncome: Double,
        monthlyNetIncome: Double,
        monthlyExpenses: Double,
        weeklyIncome: Double
    ): String {
        val totalFixedExpenses = context.totalDebts
        val coverageRatio = if (totalFixedExpenses > 0) (monthlyGrossIncome / totalFixedExpenses * 100).toInt() else 100
        val surplus = monthlyGrossIncome - totalFixedExpenses
        val dadPending = context.dadPendingAmount
        val dadCommitted = context.dadTotalCommitted
        val tripTarget = context.medellinTotalCost
        val personalQuota = (tripTarget - dadCommitted).coerceAtLeast(0.0)
        val availableFund = context.medellinAvailableFund
        val projectedWithDad = availableFund + dadPending
        val surplusMedellin = projectedWithDad - tripTarget

        val fixedExpensesDetails = if (context.fixedExpenses.isNotEmpty()) {
            context.fixedExpenses.joinToString("\n") { "  • **${it.title}:** ${CurrencyUtils.formatCOP(it.amount)} (${it.category})" }
        } else {
            "  • Suscripciones: $10.200 COP\n  • Motilada: $25.000 COP\n  • Vuelos: $140.000 COP"
        }

        return """
            ### 📊 1. Balance del Mes ($monthName)
            
            Durante este periodo has generado un total de **${CurrencyUtils.formatCOP(monthlyGrossIncome)}** en ingresos brutos combinando tus paseos de perros (Sienna y Frida) y turnos de Rappi.
            
            **Comparativa Ingresos vs Gastos Fijos:**
            • **Ingresos Totales del Mes:** ${CurrencyUtils.formatCOP(monthlyGrossIncome)}
            • **Total Gastos Fijos y Deudas:** ${CurrencyUtils.formatCOP(totalFixedExpenses)}
            $fixedExpensesDetails
            • **Gastos Variables / Imprevistos:** ${CurrencyUtils.formatCOP(monthlyExpenses)}
            • **Resultado Neto:** **${if (surplus >= 0) "+${CurrencyUtils.formatCOP(surplus)}" else "-${CurrencyUtils.formatCOP(-surplus)}"}** (Cobertura de gastos fijos al **$coverageRatio%**)
            
            ${if (surplus >= 0) "✅ **Excelente disciplina:** Tus ingresos por paseos y repartos cubren con holgura los gastos fijos básicos (suscripciones, motilada y vuelos), generando un excedente positivo para tus metas." else "⚠️ **Atención al flujo de caja:** Tus gastos fijos del mes superaron ligeramente los ingresos registrados. Revisa la frecuencia de paseos o turnos en Rappi para mantener el balance en verde."}
            
            ---
            
            ### ✈️ 2. Proyección del Siguiente Mes
            
            **Meta Viaje a Medellín (${CurrencyUtils.formatCOP(tripTarget)}):**
            • **Tu meta personal:** Gracias a que tu papá comprometió **${CurrencyUtils.formatCOP(dadCommitted)}**, tu cuota personal para todo el viaje es de únicamente **${CurrencyUtils.formatCOP(personalQuota)}**.
            • **Abono de tu Papá:** Ya te entregó **${CurrencyUtils.formatCOP(context.dadPaidAmount)}** y quedan pendientes **${CurrencyUtils.formatCOP(dadPending)}**.
            • **Pronóstico Financiero:** Con tu fondo actual de **${CurrencyUtils.formatCOP(availableFund)}** sumado al abono pendiente de tu papá (${CurrencyUtils.formatCOP(dadPending)}), tu proyección alcanza **${CurrencyUtils.formatCOP(projectedWithDad)}** (${if (surplusMedellin >= 0) "Superávit de +${CurrencyUtils.formatCOP(surplusMedellin)} para restaurantes y tours" else "Faltante mínimo de ${CurrencyUtils.formatCOP(-surplusMedellin)}"}).
            
            🔥 **Plan de Acción y Motivación para el Mes Entrante:**
            1. **Ritmo de Paseos:** Mantén los paseos regulares de **Sienna ($9.000)** y **Frida ($5.850)**. Con solo 4 días completos de paseos ($14.850/día) generas casi **$60.000 COP** netos sin tocar tus ahorros.
            2. **Cobro de Abono a Papá:** Recuerda solicitarle amablemente a tu papá los **${CurrencyUtils.formatCOP(dadPending)}** pendientes para consignarlos a tu Cuenta Nu antes de la fecha de viaje.
            3. **Alerta Temprana:** Reserva siempre un colchón de $50.000 en Nequi o Efectivo para el transporte local y cualquier imprevisto de última hora.
            
            ¡Vas a Medellín con todas las de ganar, parce! 🚀
        """.trimIndent()
    }
}
