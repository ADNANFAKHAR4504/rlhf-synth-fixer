package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutOutputReference")
public class QuicksightThemeConfigurationSheetTileLayoutOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightThemeConfigurationSheetTileLayoutOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightThemeConfigurationSheetTileLayoutOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightThemeConfigurationSheetTileLayoutOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putGutter(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter value) {
        software.amazon.jsii.Kernel.call(this, "putGutter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMargin(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin value) {
        software.amazon.jsii.Kernel.call(this, "putMargin", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetGutter() {
        software.amazon.jsii.Kernel.call(this, "resetGutter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMargin() {
        software.amazon.jsii.Kernel.call(this, "resetMargin", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutterOutputReference getGutter() {
        return software.amazon.jsii.Kernel.get(this, "gutter", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference getMargin() {
        return software.amazon.jsii.Kernel.get(this, "margin", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter getGutterInput() {
        return software.amazon.jsii.Kernel.get(this, "gutterInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin getMarginInput() {
        return software.amazon.jsii.Kernel.get(this, "marginInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
