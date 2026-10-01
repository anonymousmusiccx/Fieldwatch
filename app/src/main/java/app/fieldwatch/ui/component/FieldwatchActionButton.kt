package app.fieldwatch.ui.component

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Section surface fill. */
@Composable
internal fun spectreSectionFill(): Color {
    return MaterialTheme.colorScheme.surfaceVariant
}

/** Refined dark tile fill for modern dark actions and switch tracks. */
@Composable
internal fun spectreTileFill(): Color {
    return MaterialTheme.colorScheme.surface
}

/** Modern hairline outline shared by action buttons and switches. */
@Composable
internal fun spectreTileEdge(): Color {
    val scheme = MaterialTheme.colorScheme
    return scheme.outline.copy(alpha = 0.55f)
}

/** Action button: modern dark surface with hairline outline and crisp typography. */
@Composable
fun FieldwatchActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    contentPadding: PaddingValues = ButtonDefaults.ContentPadding,
    content: @Composable RowScope.() -> Unit,
) {
    val scheme = MaterialTheme.colorScheme
    val fill = spectreTileFill()
    val edge = spectreTileEdge()
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        enabled = enabled,
        contentPadding = contentPadding,
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = fill,
            contentColor = scheme.onSurface,
            disabledContainerColor = fill.copy(alpha = 0.4f),
            disabledContentColor = scheme.onSurface.copy(alpha = 0.38f),
        ),
        border = BorderStroke(1.dp, if (enabled) edge else edge.copy(alpha = 0.35f)),
        content = content,
    )
}
