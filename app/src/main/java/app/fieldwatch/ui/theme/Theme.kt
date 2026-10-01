package app.fieldwatch.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Phosphor = Color(0xFF10E79D)
/** Checked switch / slider fill — modern emerald. */
val PhosphorActive = Color(0xFF05CD85)
val Amber = Color(0xFFF59E0B)
val SignalRed = Color(0xFFF43F5E)
val Cyan = Color(0xFF38BDF8)
val Night = Color(0xFF0C0F14)
val Panel = Color(0xFF161B22)
val Panel2 = Color(0xFF212836)
val BorderHairline = Color(0xFF2E384D)

private val DarkColors = darkColorScheme(
    primary = Phosphor,
    onPrimary = Color(0xFF003820),
    primaryContainer = Color(0xFF0E2E20),
    onPrimaryContainer = Color(0xFF34D399),
    secondary = Amber,
    onSecondary = Color(0xFF2A1700),
    secondaryContainer = Color(0xFF2E1C05),
    onSecondaryContainer = Color(0xFFFDE68A),
    tertiary = Cyan,
    onTertiary = Color(0xFF003549),
    tertiaryContainer = Color(0xFF0C2B3F),
    onTertiaryContainer = Color(0xFFBAE6FD),
    background = Night,
    onBackground = Color(0xFFF1F5F9),
    surface = Panel,
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = Panel2,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = BorderHairline,
    outlineVariant = Color(0xFF1E2635),
    error = SignalRed,
    onError = Color(0xFF38000A),
    errorContainer = Color(0xFF3F0B15),
    onErrorContainer = Color(0xFFFECDD3),
)

/**
 * Red-on-black field display. Background stays dark; chrome and accents
 * are red ramps. Used only while Settings → Night mode is on.
 */
private val NightColors = darkColorScheme(
    primary = Color(0xFFFF5A5A),
    onPrimary = Color(0xFF2A0808),
    primaryContainer = Color(0xFF3A1212),
    onPrimaryContainer = Color(0xFFFF8A8A),
    secondary = Color(0xFFE07070),
    onSecondary = Color(0xFF2A0808),
    tertiary = Color(0xFFCC6666),
    background = Color(0xFF0B0808),
    onBackground = Color(0xFFFFC9C9),
    surface = Color(0xFF161010),
    onSurface = Color(0xFFFFC9C9),
    surfaceVariant = Color(0xFF1E1414),
    onSurfaceVariant = Color(0xFFC48A8A),
    outline = Color(0xFF5A3030),
    outlineVariant = Color(0xFF3A1C1C),
    error = Color(0xFFFF7A7A),
)

private val LightColors = lightColorScheme(
    primary = Color(0xFF0B7A48),
    onPrimary = Color.White,
    secondary = Color(0xFF9A6400),
    tertiary = Color(0xFF0277BD),
    background = Color(0xFFF4F6F8),
    onBackground = Color(0xFF12171C),
    surface = Color.White,
    onSurface = Color(0xFF12171C),
    surfaceVariant = Color(0xFFE6EBEF),
    onSurfaceVariant = Color(0xFF3F4A55),
    outline = Color(0xFFC5CDD4),
    outlineVariant = Color(0xFFDCE2E7),
    error = Color(0xFFB00020),
)

val Mono = TextStyle(
    fontFamily = FontFamily.Monospace,
    fontWeight = FontWeight.Medium,
    fontSize = 12.sp,
    letterSpacing = 0.3.sp,
)

@Composable
fun FieldwatchTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    nightMode: Boolean = false,
    content: @Composable () -> Unit,
) {
    val scheme = when {
        nightMode -> NightColors
        darkTheme -> DarkColors
        else -> LightColors
    }
    CompositionLocalProvider(LocalNightMode provides nightMode) {
        MaterialTheme(
            colorScheme = scheme,
            content = content,
        )
    }
}
