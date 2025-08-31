package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationSheetOutputReference")
public class QuicksightThemeConfigurationSheetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightThemeConfigurationSheetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightThemeConfigurationSheetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightThemeConfigurationSheetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putTile(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile value) {
        software.amazon.jsii.Kernel.call(this, "putTile", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTileLayout(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout value) {
        software.amazon.jsii.Kernel.call(this, "putTileLayout", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetTile() {
        software.amazon.jsii.Kernel.call(this, "resetTile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTileLayout() {
        software.amazon.jsii.Kernel.call(this, "resetTileLayout", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileOutputReference getTile() {
        return software.amazon.jsii.Kernel.get(this, "tile", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutOutputReference getTileLayout() {
        return software.amazon.jsii.Kernel.get(this, "tileLayout", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile getTileInput() {
        return software.amazon.jsii.Kernel.get(this, "tileInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout getTileLayoutInput() {
        return software.amazon.jsii.Kernel.get(this, "tileLayoutInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
