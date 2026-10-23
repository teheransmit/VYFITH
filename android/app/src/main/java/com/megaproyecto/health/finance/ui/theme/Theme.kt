package com.megaproyecto.health.finance.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = HighDensityLavender,
    onPrimary = HighDensityLavenderDark,
    primaryContainer = HighDensityLavenderDark,
    onPrimaryContainer = HighDensityLavenderLight,

    secondary = EmeraldGreen,
    onSecondary = EmeraldGreenDark,
    secondaryContainer = EmeraldGreenDark,
    onSecondaryContainer = EmeraldGreenLight,

    tertiary = NequiPink,
    onTertiary = NequiPinkDark,
    tertiaryContainer = NequiPinkDark,
    onTertiaryContainer = NequiPinkLight,

    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = TextSecondary,
    surfaceContainer = DarkSurfaceCard,
    surfaceContainerHigh = DarkSurfaceElevated,

    error = CoralRed,
    onError = CoralRedDark,
    errorContainer = CoralRedDark,
    onErrorContainer = CoralRedLight,

    outline = CardBorder,
    outlineVariant = CardBorderSubtle
)

@Composable
fun FinanceTheme(
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        shapes = RetroShapes,
        content = content
    )
}

// Alias for backwards compatibility
@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    FinanceTheme(content = content)
}
