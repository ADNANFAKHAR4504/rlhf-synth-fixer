package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.126Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationOutputReference")
public class QuicksightThemeConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightThemeConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightThemeConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightThemeConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDataColorPalette(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette value) {
        software.amazon.jsii.Kernel.call(this, "putDataColorPalette", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSheet(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet value) {
        software.amazon.jsii.Kernel.call(this, "putSheet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTypography(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography value) {
        software.amazon.jsii.Kernel.call(this, "putTypography", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUiColorPalette(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette value) {
        software.amazon.jsii.Kernel.call(this, "putUiColorPalette", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataColorPalette() {
        software.amazon.jsii.Kernel.call(this, "resetDataColorPalette", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSheet() {
        software.amazon.jsii.Kernel.call(this, "resetSheet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTypography() {
        software.amazon.jsii.Kernel.call(this, "resetTypography", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUiColorPalette() {
        software.amazon.jsii.Kernel.call(this, "resetUiColorPalette", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPaletteOutputReference getDataColorPalette() {
        return software.amazon.jsii.Kernel.get(this, "dataColorPalette", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPaletteOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetOutputReference getSheet() {
        return software.amazon.jsii.Kernel.get(this, "sheet", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationTypographyOutputReference getTypography() {
        return software.amazon.jsii.Kernel.get(this, "typography", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationTypographyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPaletteOutputReference getUiColorPalette() {
        return software.amazon.jsii.Kernel.get(this, "uiColorPalette", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPaletteOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette getDataColorPaletteInput() {
        return software.amazon.jsii.Kernel.get(this, "dataColorPaletteInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet getSheetInput() {
        return software.amazon.jsii.Kernel.get(this, "sheetInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography getTypographyInput() {
        return software.amazon.jsii.Kernel.get(this, "typographyInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette getUiColorPaletteInput() {
        return software.amazon.jsii.Kernel.get(this, "uiColorPaletteInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
