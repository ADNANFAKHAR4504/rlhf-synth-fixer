package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationSheetTileOutputReference")
public class QuicksightThemeConfigurationSheetTileOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightThemeConfigurationSheetTileOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightThemeConfigurationSheetTileOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightThemeConfigurationSheetTileOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBorder(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder value) {
        software.amazon.jsii.Kernel.call(this, "putBorder", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBorder() {
        software.amazon.jsii.Kernel.call(this, "resetBorder", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorderOutputReference getBorder() {
        return software.amazon.jsii.Kernel.get(this, "border", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorderOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder getBorderInput() {
        return software.amazon.jsii.Kernel.get(this, "borderInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
