package com.megaproyecto.health.finance.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FamilyRestroom
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Pets
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.megaproyecto.health.finance.ui.theme.CardBorder
import com.megaproyecto.health.finance.ui.theme.CardBorderSubtle
import com.megaproyecto.health.finance.ui.theme.CoralRed
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceCard
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceElevated
import com.megaproyecto.health.finance.ui.theme.DarkSurfaceInner
import com.megaproyecto.health.finance.ui.theme.EmeraldGreen
import com.megaproyecto.health.finance.ui.theme.HighDensityLavender
import com.megaproyecto.health.finance.ui.theme.HighDensityLavenderLight
import com.megaproyecto.health.finance.ui.theme.HighlightCyan
import com.megaproyecto.health.finance.ui.theme.NequiPink
import com.megaproyecto.health.finance.ui.theme.TextPrimary

sealed class AnalysisSection {
    data class Verdict(val status: String, val isPositive: Boolean, val body: String) : AnalysisSection()
    data class DadAbono(val title: String, val items: List<String>) : AnalysisSection()
    data class Radiography(val title: String, val items: List<String>) : AnalysisSection()
    data class ActionPlan(val title: String, val items: List<String>) : AnalysisSection()
    data class Tips(val title: String, val items: List<String>) : AnalysisSection()
    data class Generic(val title: String?, val paragraphs: List<String>) : AnalysisSection()
}

@Composable
fun FormattedAnalysisView(
    rawText: String,
    modifier: Modifier = Modifier
) {
    val sections = remember(rawText) {
        parseAnalysisToSections(rawText)
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        sections.forEach { section ->
            when (section) {
                is AnalysisSection.Verdict -> VerdictSectionCard(section)
                is AnalysisSection.DadAbono -> DadAbonoSectionCard(section)
                is AnalysisSection.Radiography -> RadiographySectionCard(section)
                is AnalysisSection.ActionPlan -> ActionPlanSectionCard(section)
                is AnalysisSection.Tips -> TipsSectionCard(section)
                is AnalysisSection.Generic -> GenericSectionCard(section)
            }
        }
    }
}

@Composable
private fun VerdictSectionCard(verdict: AnalysisSection.Verdict) {
    val statusColor = if (verdict.isPositive) EmeraldGreen else if (verdict.status.contains("AJUSTADO", true) || verdict.status.contains("CAMINO", true)) HighDensityLavender else CoralRed
    val gradientBrush = Brush.horizontalGradient(
        colors = listOf(
            statusColor.copy(alpha = 0.18f),
            DarkSurfaceElevated.copy(alpha = 0.6f)
        )
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
        border = BorderStroke(1.5.dp, statusColor.copy(alpha = 0.6f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(gradientBrush)
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
                    Icon(
                        imageVector = if (verdict.isPositive) Icons.Default.CheckCircle else Icons.Default.Warning,
                        contentDescription = null,
                        tint = statusColor,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "VEREDICTO DE VIABILIDAD",
                        fontSize = 11.sp,
                        letterSpacing = 1.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = statusColor
                    )
                }

                Surface(
                    shape = RectangleShape,
                    color = statusColor.copy(alpha = 0.2f),
                    border = BorderStroke(1.dp, statusColor.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = verdict.status,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = statusColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Text(
                text = formatCleanMarkdown(verdict.body),
                style = MaterialTheme.typography.bodyMedium.copy(
                    lineHeight = 22.sp,
                    fontSize = 14.sp
                ),
                color = TextPrimary
            )
        }
    }
}

@Composable
private fun DadAbonoSectionCard(dadAbono: AnalysisSection.DadAbono) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = BorderStroke(1.dp, NequiPink.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = RectangleShape,
                    color = NequiPink.copy(alpha = 0.2f),
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.FamilyRestroom,
                            contentDescription = null,
                            tint = NequiPink,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
                Text(
                    text = dadAbono.title.ifBlank { "Abono de tu Papá (Meta $450.000 COP)" },
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                dadAbono.items.forEach { item ->
                    ItemBubbleRow(
                        rawLine = item,
                        accentColor = NequiPink,
                        icon = Icons.Default.MonetizationOn
                    )
                }
            }
        }
    }
}

@Composable
private fun RadiographySectionCard(radiography: AnalysisSection.Radiography) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = RectangleShape,
                    color = HighDensityLavender.copy(alpha = 0.2f),
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.AccountBalance,
                            contentDescription = null,
                            tint = HighDensityLavender,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
                Text(
                    text = radiography.title.ifBlank { "Radiografía Financiera" },
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                radiography.items.forEach { item ->
                    ItemBubbleRow(
                        rawLine = item,
                        accentColor = HighDensityLavender,
                        icon = Icons.Default.TrendingUp
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionPlanSectionCard(actionPlan: AnalysisSection.ActionPlan) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = BorderStroke(1.dp, EmeraldGreen.copy(alpha = 0.4f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = RectangleShape,
                    color = EmeraldGreen.copy(alpha = 0.2f),
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Pets,
                            contentDescription = null,
                            tint = EmeraldGreen,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
                Text(
                    text = actionPlan.title.ifBlank { "Plan de Acción de Ingresos" },
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                actionPlan.items.forEach { item ->
                    ItemBubbleRow(
                        rawLine = item,
                        accentColor = EmeraldGreen,
                        icon = if (item.contains("Sienna", true) || item.contains("Frida", true) || item.contains("paseo", true)) Icons.Default.Pets else Icons.Default.TrendingUp
                    )
                }
            }
        }
    }
}

@Composable
private fun TipsSectionCard(tips: AnalysisSection.Tips) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = BorderStroke(1.dp, HighlightCyan.copy(alpha = 0.35f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = RectangleShape,
                    color = HighlightCyan.copy(alpha = 0.2f),
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Lightbulb,
                            contentDescription = null,
                            tint = HighlightCyan,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
                Text(
                    text = tips.title.ifBlank { "Recomendaciones Estratégicas" },
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                tips.items.forEachIndexed { index, item ->
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RectangleShape,
                        color = DarkSurfaceInner,
                        border = BorderStroke(1.dp, CardBorderSubtle)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Surface(
                                modifier = Modifier.size(22.dp),
                                shape = RectangleShape,
                                color = HighlightCyan.copy(alpha = 0.15f)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = "${index + 1}",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = HighlightCyan
                                    )
                                }
                            }

                            Text(
                                text = formatCleanMarkdown(item),
                                style = MaterialTheme.typography.bodySmall.copy(
                                    lineHeight = 20.sp,
                                    fontSize = 13.sp
                                ),
                                color = TextPrimary,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GenericSectionCard(section: AnalysisSection.Generic) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RectangleShape,
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceCard),
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (!section.title.isNullOrBlank()) {
                Text(
                    text = section.title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = HighDensityLavender
                )
            }

            section.paragraphs.forEach { p ->
                Text(
                    text = formatCleanMarkdown(p),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        lineHeight = 22.sp,
                        fontSize = 13.5.sp
                    ),
                    color = TextPrimary
                )
            }
        }
    }
}

@Composable
private fun ItemBubbleRow(
    rawLine: String,
    accentColor: Color,
    icon: ImageVector
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RectangleShape,
        color = DarkSurfaceInner,
        border = BorderStroke(1.dp, CardBorderSubtle)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(24.dp),
                shape = RectangleShape,
                color = accentColor.copy(alpha = 0.15f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(13.dp)
                    )
                }
            }

            Text(
                text = formatCleanMarkdown(rawLine),
                style = MaterialTheme.typography.bodySmall.copy(
                    lineHeight = 20.sp,
                    fontSize = 13.sp
                ),
                color = TextPrimary,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

fun formatCleanMarkdown(text: String): AnnotatedString {
    var clean = text
        .replace(Regex("^(\\s*[#*•\\-]+\\s*)+"), "")
        .replace("###", "")
        .replace("##", "")
        .replace("#", "")
        .trim()

    clean = clean.replace(Regex("^\\d+\\.\\s*"), "")

    return buildAnnotatedString {
        var cursor = 0
        val boldRegex = Regex("\\*\\*(.*?)\\*\\*")
        val matches = boldRegex.findAll(clean)

        for (match in matches) {
            val start = match.range.first
            val end = match.range.last + 1

            if (start > cursor) {
                append(clean.substring(cursor, start))
            }

            val boldContent = match.groupValues[1]
            pushStyle(
                SpanStyle(
                    fontWeight = FontWeight.Bold,
                    color = if (boldContent.contains("$") || boldContent.contains("COP", true)) {
                        HighDensityLavenderLight
                    } else {
                        TextPrimary
                    }
                )
            )
            append(boldContent)
            pop()

            cursor = end
        }

        if (cursor < clean.length) {
            append(clean.substring(cursor))
        }
    }
}

private fun parseAnalysisToSections(rawText: String): List<AnalysisSection> {
    if (rawText.isBlank()) return emptyList()

    val rawBlocks = rawText.split(Regex("(?m)^\\s*---\\s*$"))
        .flatMap { it.split("\n\n\n") }
        .map { it.trim() }
        .filter { it.isNotBlank() }

    val sections = mutableListOf<AnalysisSection>()

    for (block in rawBlocks) {
        val lines = block.lines().map { it.trim() }.filter { it.isNotBlank() }
        if (lines.isEmpty()) continue

        val firstLine = lines.first()

        when {
            firstLine.contains("Veredicto", ignoreCase = true) || firstLine.contains("Viabilidad", ignoreCase = true) -> {
                val status = extractVerdictStatus(block)
                val isPositive = status.contains("EXCELENTE", true) || status.contains("BIEN", true) || status.contains("100%", true)
                val bodyLines = lines.filterNot {
                    it.contains("Veredicto", ignoreCase = true) || it.startsWith("###") || it.contains("AJUSTADO") || it.contains("EXCELENTE")
                }
                val body = if (bodyLines.isNotEmpty()) bodyLines.joinToString(" ") else block
                sections.add(AnalysisSection.Verdict(status = status, isPositive = isPositive, body = body))
            }
            firstLine.contains("Papá", ignoreCase = true) || firstLine.contains("Papa", ignoreCase = true) || firstLine.contains("Abono de tu Papá", ignoreCase = true) -> {
                val items = lines.drop(1).filter { it.startsWith("*") || it.startsWith("•") || it.startsWith("-") || it.contains(":") }
                sections.add(AnalysisSection.DadAbono(
                    title = cleanHeader(firstLine),
                    items = if (items.isNotEmpty()) items else lines.drop(1)
                ))
            }
            firstLine.contains("Radiografía", ignoreCase = true) || firstLine.contains("Finanzas", ignoreCase = true) -> {
                val items = lines.drop(1).filter { it.startsWith("*") || it.startsWith("•") || it.startsWith("-") || it.contains(":") }
                sections.add(AnalysisSection.Radiography(
                    title = cleanHeader(firstLine),
                    items = if (items.isNotEmpty()) items else lines.drop(1)
                ))
            }
            firstLine.contains("Plan de Acción", ignoreCase = true) || firstLine.contains("Ingresos", ignoreCase = true) || firstLine.contains("Paseos", ignoreCase = true) -> {
                val items = lines.drop(1).filter { it.startsWith("*") || it.startsWith("•") || it.startsWith("-") || it.contains(":") }
                sections.add(AnalysisSection.ActionPlan(
                    title = cleanHeader(firstLine),
                    items = if (items.isNotEmpty()) items else lines.drop(1)
                ))
            }
            firstLine.contains("Consejos", ignoreCase = true) || firstLine.contains("Recomendaciones", ignoreCase = true) || firstLine.contains("Estrategia", ignoreCase = true) -> {
                val items = lines.drop(1).filter { it.startsWith("*") || it.startsWith("•") || it.startsWith("-") || it.matches(Regex("^\\d+\\..*")) }
                sections.add(AnalysisSection.Tips(
                    title = cleanHeader(firstLine),
                    items = if (items.isNotEmpty()) items else lines.drop(1)
                ))
            }
            else -> {
                sections.add(AnalysisSection.Generic(
                    title = if (firstLine.startsWith("#")) cleanHeader(firstLine) else null,
                    paragraphs = if (firstLine.startsWith("#")) lines.drop(1) else lines
                ))
            }
        }
    }

    return sections
}

private fun cleanHeader(header: String): String {
    return header
        .replace("###", "")
        .replace("##", "")
        .replace("#", "")
        .replace("**", "")
        .trim()
}

private fun extractVerdictStatus(block: String): String {
    return when {
        block.contains("EXCELENTE", ignoreCase = true) -> "EXCELENTE 🚀"
        block.contains("SOBRADO", ignoreCase = true) -> "SOBRADO 🟢"
        block.contains("VAS MUY BIEN", ignoreCase = true) -> "MUY BIEN 🟢"
        block.contains("AJUSTADO", ignoreCase = true) -> "AJUSTADO ⚠️"
        block.contains("BUEN CAMINO", ignoreCase = true) -> "EN CAMINO 🟡"
        block.contains("DÉFICIT", ignoreCase = true) -> "DÉFICIT 🔴"
        block.contains("RIESGO", ignoreCase = true) -> "RIESGO 🔴"
        else -> "EN EVALUACIÓN ✦"
    }
}
