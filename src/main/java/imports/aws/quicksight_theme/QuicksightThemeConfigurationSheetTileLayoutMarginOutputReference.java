package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference")
public class QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightThemeConfigurationSheetTileLayoutMarginOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetShow() {
        software.amazon.jsii.Kernel.call(this, "resetShow", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getShowInput() {
        return software.amazon.jsii.Kernel.get(this, "showInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getShow() {
        return software.amazon.jsii.Kernel.get(this, "show", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setShow(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "show", java.util.Objects.requireNonNull(value, "show is required"));
    }

    public void setShow(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "show", java.util.Objects.requireNonNull(value, "show is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
