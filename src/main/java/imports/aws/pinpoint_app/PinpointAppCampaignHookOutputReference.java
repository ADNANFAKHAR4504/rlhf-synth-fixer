package imports.aws.pinpoint_app;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.058Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointApp.PinpointAppCampaignHookOutputReference")
public class PinpointAppCampaignHookOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PinpointAppCampaignHookOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PinpointAppCampaignHookOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PinpointAppCampaignHookOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLambdaFunctionName() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMode() {
        software.amazon.jsii.Kernel.call(this, "resetMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWebUrl() {
        software.amazon.jsii.Kernel.call(this, "resetWebUrl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaFunctionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModeInput() {
        return software.amazon.jsii.Kernel.get(this, "modeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWebUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "webUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambdaFunctionName() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambdaFunctionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambdaFunctionName", java.util.Objects.requireNonNull(value, "lambdaFunctionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMode() {
        return software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mode", java.util.Objects.requireNonNull(value, "mode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWebUrl() {
        return software.amazon.jsii.Kernel.get(this, "webUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWebUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "webUrl", java.util.Objects.requireNonNull(value, "webUrl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pinpoint_app.PinpointAppCampaignHook getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pinpoint_app.PinpointAppCampaignHook.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pinpoint_app.PinpointAppCampaignHook value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
