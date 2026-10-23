package com.megaproyecto.health.finance.util

import java.text.NumberFormat
import java.util.Locale

object CurrencyUtils {
    private val colombianFormat = NumberFormat.getCurrencyInstance(Locale("es", "CO")).apply {
        maximumFractionDigits = 0
        minimumFractionDigits = 0
    }

    fun formatCOP(amount: Double): String {
        return colombianFormat.format(amount)
    }

    fun formatCOP(amount: Long): String {
        return colombianFormat.format(amount)
    }

    fun parseAmount(input: String): Double {
        val clean = input.replace(Regex("[^0-9.-]"), "")
        return clean.toDoubleOrNull() ?: 0.0
    }

    fun formatCompactCOP(amount: Double): String {
        return when {
            amount >= 1_000_000 -> String.format(Locale("es", "CO"), "$%.1fM", amount / 1_000_000)
            amount >= 1_000 -> {
                val inK = amount / 1_000
                if (inK % 1.0 == 0.0) {
                    String.format(Locale("es", "CO"), "$%.0fk", inK)
                } else {
                    String.format(Locale("es", "CO"), "$%.1fk", inK)
                }
            }
            amount > 0 -> String.format(Locale("es", "CO"), "$%.0f", amount)
            else -> "$0"
        }
    }
}
