package com.megaproyecto.health.finance.ui.theme

import androidx.compose.ui.graphics.Color

// =================================================================
// PALETA DE COLORES: DARK FANTASY RETRO PIXEL ART (16-BIT SNES/RPG)
// =================================================================

// 1. Fondo principal: Negro profundo simulando una mazmorra (#000000 o #0D0A10)
val DarkBackground = Color(0xFF0A070E)

// 2. Superficies: Gris plomizo o púrpura muy oscuro (#1E1A24) simulando paneles de inventario RPG
val DarkSurface = Color(0xFF1E1A24)
val DarkSurfaceVariant = Color(0xFF262030)
val DarkSurfaceCard = Color(0xFF1E1A24)
val DarkSurfaceElevated = Color(0xFF2B2436)
val DarkSurfaceInner = Color(0xFF120E18) // Ranura oscura de item/slot de inventario

// 3. Acentos: Dorado envejecido (#B89947) y Morado místico (#5E35B1)
val AncientGold = Color(0xFFB89947)
val AncientGoldLight = Color(0xFFD9BD6F)
val AncientGoldDark = Color(0xFF6E551E)

val MysticPurple = Color(0xFF5E35B1)
val MysticPurpleLight = Color(0xFF7E57C2)
val MysticPurpleDark = Color(0xFF321A68)

// Alias para mantener compatibilidad total con llamadas existentes
val HighDensityLavender = AncientGold
val HighDensityLavenderLight = AncientGoldLight
val HighDensityLavenderDark = AncientGoldDark
val HighDensityLavenderSubtle = AncientGoldLight

// 4. Textos de Dinero:
// Verde tóxico/neón (#39FF14) para balances positivos y ganancias
val ToxicGreen = Color(0xFF39FF14)
val EmeraldGreen = ToxicGreen
val EmeraldGreenLight = Color(0xFF66FF47)
val EmeraldGreenDark = Color(0xFF0F5A04)

// Rojo sangre (#8A0303 o #FF1111) para deudas, gastos o déficit
val BloodRed = Color(0xFFFF1A1A)
val BloodRedDark = Color(0xFF8A0303)
val BloodRedLight = Color(0xFFFF5C5C)
val CoralRed = BloodRed
val CoralRedLight = BloodRedLight
val CoralRedDark = BloodRedDark

// Cuentas temáticas Dark Fantasy
val NuPurple = MysticPurple
val NuPurpleLight = MysticPurpleLight
val NuPurpleDark = MysticPurpleDark

val NequiPink = Color(0xFFB71C1C) // Rubí carmesí de maná
val NequiPinkLight = Color(0xFFE53935)
val NequiPinkDark = Color(0xFF5A0000)

val CashGold = AncientGold
val CashGoldLight = AncientGoldLight

val HighlightCyan = Color(0xFF00E5FF) // Cristal de éter

// Tipografía estilo pergamino antiguo / runas legibles
val TextPrimary = Color(0xFFEAE5D4)   // Pergamino iluminado
val TextSecondary = Color(0xFFAFABA0) // Piedra gastada
val TextTertiary = Color(0xFF787265)  // Ceniza oscura

// Bordes de diálogo RPG de SNES (2.dp o 4.dp de grosor)
val CardBorder = Color(0xFFB89947)       // Marco dorado de ventana RPG
val CardBorderSubtle = Color(0xFF8E8A9C) // Marco plateado / gris claro
val RpgBorderGold = Color(0xFFB89947)
val RpgBorderStone = Color(0xFF8E8A9C)
