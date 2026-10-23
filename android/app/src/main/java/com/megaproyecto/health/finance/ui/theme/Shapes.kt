package com.megaproyecto.health.finance.ui.theme

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

// =================================================================
// FORMAS Y BORDES RETRO RPG 16-BIT (VENTANAS SNES)
// =================================================================
// Todas las esquinas son afiladas (0.dp - sin bordes redondeados)
val RetroShapes = Shapes(
    extraSmall = RoundedCornerShape(0.dp),
    small = RoundedCornerShape(0.dp),
    medium = RoundedCornerShape(0.dp),
    large = RoundedCornerShape(0.dp),
    extraLarge = RoundedCornerShape(0.dp)
)

// Bordes gruesos de 2.dp a 4.dp estilo ventana de diálogo SNES
val RpgWindowBorder = BorderStroke(2.dp, AncientGold)
val RpgWindowBorderThick = BorderStroke(3.dp, AncientGold)
val RpgSubtleBorder = BorderStroke(2.dp, CardBorderSubtle)
val RpgStoneBorderStroke = BorderStroke(2.dp, RpgBorderStone)
