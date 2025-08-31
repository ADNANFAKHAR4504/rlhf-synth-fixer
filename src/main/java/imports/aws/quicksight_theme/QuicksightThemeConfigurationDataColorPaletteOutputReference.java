package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.126Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationDataColorPaletteOutputReference")
public class QuicksightThemeConfigurationDataColorPaletteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightThemeConfigurationDataColorPaletteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightThemeConfigurationDataColorPaletteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightThemeConfigurationDataColorPaletteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetColors() {
        software.amazon.jsii.Kernel.call(this, "resetColors", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmptyFillColor() {
        software.amazon.jsii.Kernel.call(this, "resetEmptyFillColor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinMaxGradient() {
        software.amazon.jsii.Kernel.call(this, "resetMinMaxGradient", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getColorsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "colorsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmptyFillColorInput() {
        return software.amazon.jsii.Kernel.get(this, "emptyFillColorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getMinMaxGradientInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "minMaxGradientInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getColors() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "colors", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setColors(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "colors", java.util.Objects.requireNonNull(value, "colors is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmptyFillColor() {
        return software.amazon.jsii.Kernel.get(this, "emptyFillColor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmptyFillColor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emptyFillColor", java.util.Objects.requireNonNull(value, "emptyFillColor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMinMaxGradient() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "minMaxGradient", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setMinMaxGradient(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "minMaxGradient", java.util.Objects.requireNonNull(value, "minMaxGradient is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
