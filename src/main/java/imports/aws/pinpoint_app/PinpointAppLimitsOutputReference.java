package imports.aws.pinpoint_app;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointApp.PinpointAppLimitsOutputReference")
public class PinpointAppLimitsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PinpointAppLimitsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PinpointAppLimitsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PinpointAppLimitsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDaily() {
        software.amazon.jsii.Kernel.call(this, "resetDaily", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumDuration() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessagesPerSecond() {
        software.amazon.jsii.Kernel.call(this, "resetMessagesPerSecond", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTotal() {
        software.amazon.jsii.Kernel.call(this, "resetTotal", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDailyInput() {
        return software.amazon.jsii.Kernel.get(this, "dailyInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMessagesPerSecondInput() {
        return software.amazon.jsii.Kernel.get(this, "messagesPerSecondInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTotalInput() {
        return software.amazon.jsii.Kernel.get(this, "totalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDaily() {
        return software.amazon.jsii.Kernel.get(this, "daily", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDaily(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "daily", java.util.Objects.requireNonNull(value, "daily is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumDuration() {
        return software.amazon.jsii.Kernel.get(this, "maximumDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumDuration(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumDuration", java.util.Objects.requireNonNull(value, "maximumDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMessagesPerSecond() {
        return software.amazon.jsii.Kernel.get(this, "messagesPerSecond", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMessagesPerSecond(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "messagesPerSecond", java.util.Objects.requireNonNull(value, "messagesPerSecond is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotal() {
        return software.amazon.jsii.Kernel.get(this, "total", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTotal(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "total", java.util.Objects.requireNonNull(value, "total is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pinpoint_app.PinpointAppLimits getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pinpoint_app.PinpointAppLimits.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pinpoint_app.PinpointAppLimits value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
