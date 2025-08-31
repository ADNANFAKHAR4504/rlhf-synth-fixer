package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.108Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyPredictiveScalingConfigurationOutputReference")
public class AutoscalingPolicyPredictiveScalingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingPolicyPredictiveScalingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingPolicyPredictiveScalingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingPolicyPredictiveScalingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMetricSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putMetricSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMaxCapacityBreachBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetMaxCapacityBreachBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxCapacityBuffer() {
        software.amazon.jsii.Kernel.call(this, "resetMaxCapacityBuffer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMode() {
        software.amazon.jsii.Kernel.call(this, "resetMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchedulingBufferTime() {
        software.amazon.jsii.Kernel.call(this, "resetSchedulingBufferTime", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationOutputReference getMetricSpecification() {
        return software.amazon.jsii.Kernel.get(this, "metricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxCapacityBreachBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacityBreachBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxCapacityBufferInput() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacityBufferInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification getMetricSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "metricSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModeInput() {
        return software.amazon.jsii.Kernel.get(this, "modeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSchedulingBufferTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "schedulingBufferTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxCapacityBreachBehavior() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacityBreachBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxCapacityBreachBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxCapacityBreachBehavior", java.util.Objects.requireNonNull(value, "maxCapacityBreachBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxCapacityBuffer() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacityBuffer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxCapacityBuffer(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxCapacityBuffer", java.util.Objects.requireNonNull(value, "maxCapacityBuffer is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMode() {
        return software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mode", java.util.Objects.requireNonNull(value, "mode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSchedulingBufferTime() {
        return software.amazon.jsii.Kernel.get(this, "schedulingBufferTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSchedulingBufferTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "schedulingBufferTime", java.util.Objects.requireNonNull(value, "schedulingBufferTime is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
