package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.108Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyStepAdjustmentOutputReference")
public class AutoscalingPolicyStepAdjustmentOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingPolicyStepAdjustmentOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingPolicyStepAdjustmentOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AutoscalingPolicyStepAdjustmentOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetMetricIntervalLowerBound() {
        software.amazon.jsii.Kernel.call(this, "resetMetricIntervalLowerBound", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricIntervalUpperBound() {
        software.amazon.jsii.Kernel.call(this, "resetMetricIntervalUpperBound", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricIntervalLowerBoundInput() {
        return software.amazon.jsii.Kernel.get(this, "metricIntervalLowerBoundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricIntervalUpperBoundInput() {
        return software.amazon.jsii.Kernel.get(this, "metricIntervalUpperBoundInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScalingAdjustmentInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingAdjustmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricIntervalLowerBound() {
        return software.amazon.jsii.Kernel.get(this, "metricIntervalLowerBound", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricIntervalLowerBound(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricIntervalLowerBound", java.util.Objects.requireNonNull(value, "metricIntervalLowerBound is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricIntervalUpperBound() {
        return software.amazon.jsii.Kernel.get(this, "metricIntervalUpperBound", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricIntervalUpperBound(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricIntervalUpperBound", java.util.Objects.requireNonNull(value, "metricIntervalUpperBound is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScalingAdjustment() {
        return software.amazon.jsii.Kernel.get(this, "scalingAdjustment", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScalingAdjustment(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scalingAdjustment", java.util.Objects.requireNonNull(value, "scalingAdjustment is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustment value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
