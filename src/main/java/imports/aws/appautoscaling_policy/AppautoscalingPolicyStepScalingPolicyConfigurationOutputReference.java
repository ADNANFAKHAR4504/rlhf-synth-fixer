package imports.aws.appautoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.979Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appautoscalingPolicy.AppautoscalingPolicyStepScalingPolicyConfigurationOutputReference")
public class AppautoscalingPolicyStepScalingPolicyConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppautoscalingPolicyStepScalingPolicyConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppautoscalingPolicyStepScalingPolicyConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppautoscalingPolicyStepScalingPolicyConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putStepAdjustment(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfigurationStepAdjustment>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfigurationStepAdjustment> __cast_cd4240 = (java.util.List<imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfigurationStepAdjustment>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfigurationStepAdjustment __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStepAdjustment", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdjustmentType() {
        software.amazon.jsii.Kernel.call(this, "resetAdjustmentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCooldown() {
        software.amazon.jsii.Kernel.call(this, "resetCooldown", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricAggregationType() {
        software.amazon.jsii.Kernel.call(this, "resetMetricAggregationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinAdjustmentMagnitude() {
        software.amazon.jsii.Kernel.call(this, "resetMinAdjustmentMagnitude", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStepAdjustment() {
        software.amazon.jsii.Kernel.call(this, "resetStepAdjustment", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfigurationStepAdjustmentList getStepAdjustment() {
        return software.amazon.jsii.Kernel.get(this, "stepAdjustment", software.amazon.jsii.NativeType.forClass(imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfigurationStepAdjustmentList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdjustmentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "adjustmentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCooldownInput() {
        return software.amazon.jsii.Kernel.get(this, "cooldownInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricAggregationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "metricAggregationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinAdjustmentMagnitudeInput() {
        return software.amazon.jsii.Kernel.get(this, "minAdjustmentMagnitudeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStepAdjustmentInput() {
        return software.amazon.jsii.Kernel.get(this, "stepAdjustmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdjustmentType() {
        return software.amazon.jsii.Kernel.get(this, "adjustmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdjustmentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adjustmentType", java.util.Objects.requireNonNull(value, "adjustmentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCooldown() {
        return software.amazon.jsii.Kernel.get(this, "cooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCooldown(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cooldown", java.util.Objects.requireNonNull(value, "cooldown is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricAggregationType() {
        return software.amazon.jsii.Kernel.get(this, "metricAggregationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricAggregationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricAggregationType", java.util.Objects.requireNonNull(value, "metricAggregationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinAdjustmentMagnitude() {
        return software.amazon.jsii.Kernel.get(this, "minAdjustmentMagnitude", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinAdjustmentMagnitude(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minAdjustmentMagnitude", java.util.Objects.requireNonNull(value, "minAdjustmentMagnitude is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
