package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.130Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationUiColorPaletteOutputReference")
public class QuicksightThemeConfigurationUiColorPaletteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightThemeConfigurationUiColorPaletteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightThemeConfigurationUiColorPaletteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightThemeConfigurationUiColorPaletteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccent() {
        software.amazon.jsii.Kernel.call(this, "resetAccent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAccentForeground() {
        software.amazon.jsii.Kernel.call(this, "resetAccentForeground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDanger() {
        software.amazon.jsii.Kernel.call(this, "resetDanger", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDangerForeground() {
        software.amazon.jsii.Kernel.call(this, "resetDangerForeground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDimension() {
        software.amazon.jsii.Kernel.call(this, "resetDimension", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDimensionForeground() {
        software.amazon.jsii.Kernel.call(this, "resetDimensionForeground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMeasure() {
        software.amazon.jsii.Kernel.call(this, "resetMeasure", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMeasureForeground() {
        software.amazon.jsii.Kernel.call(this, "resetMeasureForeground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrimaryBackground() {
        software.amazon.jsii.Kernel.call(this, "resetPrimaryBackground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrimaryForeground() {
        software.amazon.jsii.Kernel.call(this, "resetPrimaryForeground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecondaryBackground() {
        software.amazon.jsii.Kernel.call(this, "resetSecondaryBackground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecondaryForeground() {
        software.amazon.jsii.Kernel.call(this, "resetSecondaryForeground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuccess() {
        software.amazon.jsii.Kernel.call(this, "resetSuccess", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuccessForeground() {
        software.amazon.jsii.Kernel.call(this, "resetSuccessForeground", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWarning() {
        software.amazon.jsii.Kernel.call(this, "resetWarning", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWarningForeground() {
        software.amazon.jsii.Kernel.call(this, "resetWarningForeground", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccentForegroundInput() {
        return software.amazon.jsii.Kernel.get(this, "accentForegroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccentInput() {
        return software.amazon.jsii.Kernel.get(this, "accentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDangerForegroundInput() {
        return software.amazon.jsii.Kernel.get(this, "dangerForegroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDangerInput() {
        return software.amazon.jsii.Kernel.get(this, "dangerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDimensionForegroundInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionForegroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDimensionInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMeasureForegroundInput() {
        return software.amazon.jsii.Kernel.get(this, "measureForegroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMeasureInput() {
        return software.amazon.jsii.Kernel.get(this, "measureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrimaryBackgroundInput() {
        return software.amazon.jsii.Kernel.get(this, "primaryBackgroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrimaryForegroundInput() {
        return software.amazon.jsii.Kernel.get(this, "primaryForegroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecondaryBackgroundInput() {
        return software.amazon.jsii.Kernel.get(this, "secondaryBackgroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecondaryForegroundInput() {
        return software.amazon.jsii.Kernel.get(this, "secondaryForegroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuccessForegroundInput() {
        return software.amazon.jsii.Kernel.get(this, "successForegroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuccessInput() {
        return software.amazon.jsii.Kernel.get(this, "successInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWarningForegroundInput() {
        return software.amazon.jsii.Kernel.get(this, "warningForegroundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWarningInput() {
        return software.amazon.jsii.Kernel.get(this, "warningInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccent() {
        return software.amazon.jsii.Kernel.get(this, "accent", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccent(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accent", java.util.Objects.requireNonNull(value, "accent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccentForeground() {
        return software.amazon.jsii.Kernel.get(this, "accentForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccentForeground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accentForeground", java.util.Objects.requireNonNull(value, "accentForeground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDanger() {
        return software.amazon.jsii.Kernel.get(this, "danger", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDanger(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "danger", java.util.Objects.requireNonNull(value, "danger is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDangerForeground() {
        return software.amazon.jsii.Kernel.get(this, "dangerForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDangerForeground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dangerForeground", java.util.Objects.requireNonNull(value, "dangerForeground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimension() {
        return software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDimension(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dimension", java.util.Objects.requireNonNull(value, "dimension is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimensionForeground() {
        return software.amazon.jsii.Kernel.get(this, "dimensionForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDimensionForeground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dimensionForeground", java.util.Objects.requireNonNull(value, "dimensionForeground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMeasure() {
        return software.amazon.jsii.Kernel.get(this, "measure", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMeasure(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "measure", java.util.Objects.requireNonNull(value, "measure is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMeasureForeground() {
        return software.amazon.jsii.Kernel.get(this, "measureForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMeasureForeground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "measureForeground", java.util.Objects.requireNonNull(value, "measureForeground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryBackground() {
        return software.amazon.jsii.Kernel.get(this, "primaryBackground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrimaryBackground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "primaryBackground", java.util.Objects.requireNonNull(value, "primaryBackground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryForeground() {
        return software.amazon.jsii.Kernel.get(this, "primaryForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrimaryForeground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "primaryForeground", java.util.Objects.requireNonNull(value, "primaryForeground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecondaryBackground() {
        return software.amazon.jsii.Kernel.get(this, "secondaryBackground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecondaryBackground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secondaryBackground", java.util.Objects.requireNonNull(value, "secondaryBackground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecondaryForeground() {
        return software.amazon.jsii.Kernel.get(this, "secondaryForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecondaryForeground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secondaryForeground", java.util.Objects.requireNonNull(value, "secondaryForeground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuccess() {
        return software.amazon.jsii.Kernel.get(this, "success", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuccess(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "success", java.util.Objects.requireNonNull(value, "success is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuccessForeground() {
        return software.amazon.jsii.Kernel.get(this, "successForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuccessForeground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "successForeground", java.util.Objects.requireNonNull(value, "successForeground is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWarning() {
        return software.amazon.jsii.Kernel.get(this, "warning", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWarning(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "warning", java.util.Objects.requireNonNull(value, "warning is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWarningForeground() {
        return software.amazon.jsii.Kernel.get(this, "warningForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWarningForeground(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "warningForeground", java.util.Objects.requireNonNull(value, "warningForeground is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
