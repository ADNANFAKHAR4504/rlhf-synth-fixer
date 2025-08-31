package imports.aws.appautoscaling_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.982Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appautoscalingTarget.AppautoscalingTargetSuspendedStateOutputReference")
public class AppautoscalingTargetSuspendedStateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppautoscalingTargetSuspendedStateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppautoscalingTargetSuspendedStateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppautoscalingTargetSuspendedStateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDynamicScalingInSuspended() {
        software.amazon.jsii.Kernel.call(this, "resetDynamicScalingInSuspended", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDynamicScalingOutSuspended() {
        software.amazon.jsii.Kernel.call(this, "resetDynamicScalingOutSuspended", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduledScalingSuspended() {
        software.amazon.jsii.Kernel.call(this, "resetScheduledScalingSuspended", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDynamicScalingInSuspendedInput() {
        return software.amazon.jsii.Kernel.get(this, "dynamicScalingInSuspendedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDynamicScalingOutSuspendedInput() {
        return software.amazon.jsii.Kernel.get(this, "dynamicScalingOutSuspendedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getScheduledScalingSuspendedInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduledScalingSuspendedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDynamicScalingInSuspended() {
        return software.amazon.jsii.Kernel.get(this, "dynamicScalingInSuspended", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDynamicScalingInSuspended(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "dynamicScalingInSuspended", java.util.Objects.requireNonNull(value, "dynamicScalingInSuspended is required"));
    }

    public void setDynamicScalingInSuspended(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "dynamicScalingInSuspended", java.util.Objects.requireNonNull(value, "dynamicScalingInSuspended is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDynamicScalingOutSuspended() {
        return software.amazon.jsii.Kernel.get(this, "dynamicScalingOutSuspended", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDynamicScalingOutSuspended(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "dynamicScalingOutSuspended", java.util.Objects.requireNonNull(value, "dynamicScalingOutSuspended is required"));
    }

    public void setDynamicScalingOutSuspended(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "dynamicScalingOutSuspended", java.util.Objects.requireNonNull(value, "dynamicScalingOutSuspended is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getScheduledScalingSuspended() {
        return software.amazon.jsii.Kernel.get(this, "scheduledScalingSuspended", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setScheduledScalingSuspended(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "scheduledScalingSuspended", java.util.Objects.requireNonNull(value, "scheduledScalingSuspended is required"));
    }

    public void setScheduledScalingSuspended(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "scheduledScalingSuspended", java.util.Objects.requireNonNull(value, "scheduledScalingSuspended is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appautoscaling_target.AppautoscalingTargetSuspendedState getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appautoscaling_target.AppautoscalingTargetSuspendedState.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appautoscaling_target.AppautoscalingTargetSuspendedState value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
