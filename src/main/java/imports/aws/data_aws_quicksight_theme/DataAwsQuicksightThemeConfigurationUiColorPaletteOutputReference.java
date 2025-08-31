package imports.aws.data_aws_quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.813Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsQuicksightTheme.DataAwsQuicksightThemeConfigurationUiColorPaletteOutputReference")
public class DataAwsQuicksightThemeConfigurationUiColorPaletteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsQuicksightThemeConfigurationUiColorPaletteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsQuicksightThemeConfigurationUiColorPaletteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsQuicksightThemeConfigurationUiColorPaletteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccent() {
        return software.amazon.jsii.Kernel.get(this, "accent", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccentForeground() {
        return software.amazon.jsii.Kernel.get(this, "accentForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDanger() {
        return software.amazon.jsii.Kernel.get(this, "danger", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDangerForeground() {
        return software.amazon.jsii.Kernel.get(this, "dangerForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimension() {
        return software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimensionForeground() {
        return software.amazon.jsii.Kernel.get(this, "dimensionForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMeasure() {
        return software.amazon.jsii.Kernel.get(this, "measure", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMeasureForeground() {
        return software.amazon.jsii.Kernel.get(this, "measureForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryBackground() {
        return software.amazon.jsii.Kernel.get(this, "primaryBackground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryForeground() {
        return software.amazon.jsii.Kernel.get(this, "primaryForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecondaryBackground() {
        return software.amazon.jsii.Kernel.get(this, "secondaryBackground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecondaryForeground() {
        return software.amazon.jsii.Kernel.get(this, "secondaryForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuccess() {
        return software.amazon.jsii.Kernel.get(this, "success", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuccessForeground() {
        return software.amazon.jsii.Kernel.get(this, "successForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWarning() {
        return software.amazon.jsii.Kernel.get(this, "warning", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWarningForeground() {
        return software.amazon.jsii.Kernel.get(this, "warningForeground", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_quicksight_theme.DataAwsQuicksightThemeConfigurationUiColorPalette getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_theme.DataAwsQuicksightThemeConfigurationUiColorPalette.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_quicksight_theme.DataAwsQuicksightThemeConfigurationUiColorPalette value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
