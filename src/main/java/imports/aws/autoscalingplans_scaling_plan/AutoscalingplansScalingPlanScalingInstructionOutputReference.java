package imports.aws.autoscalingplans_scaling_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionOutputReference")
public class AutoscalingplansScalingPlanScalingInstructionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingplansScalingPlanScalingInstructionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingplansScalingPlanScalingInstructionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AutoscalingplansScalingPlanScalingInstructionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCustomizedLoadMetricSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCustomizedLoadMetricSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPredefinedLoadMetricSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putPredefinedLoadMetricSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetTrackingConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration> __cast_cd4240 = (java.util.List<imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargetTrackingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomizedLoadMetricSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCustomizedLoadMetricSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableDynamicScaling() {
        software.amazon.jsii.Kernel.call(this, "resetDisableDynamicScaling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPredefinedLoadMetricSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetPredefinedLoadMetricSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPredictiveScalingMaxCapacityBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetPredictiveScalingMaxCapacityBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPredictiveScalingMaxCapacityBuffer() {
        software.amazon.jsii.Kernel.call(this, "resetPredictiveScalingMaxCapacityBuffer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPredictiveScalingMode() {
        software.amazon.jsii.Kernel.call(this, "resetPredictiveScalingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScalingPolicyUpdateBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetScalingPolicyUpdateBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduledActionBufferTime() {
        software.amazon.jsii.Kernel.call(this, "resetScheduledActionBufferTime", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecificationOutputReference getCustomizedLoadMetricSpecification() {
        return software.amazon.jsii.Kernel.get(this, "customizedLoadMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecificationOutputReference getPredefinedLoadMetricSpecification() {
        return software.amazon.jsii.Kernel.get(this, "predefinedLoadMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationList getTargetTrackingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "targetTrackingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification getCustomizedLoadMetricSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "customizedLoadMetricSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableDynamicScalingInput() {
        return software.amazon.jsii.Kernel.get(this, "disableDynamicScalingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "minCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification getPredefinedLoadMetricSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "predefinedLoadMetricSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPredictiveScalingMaxCapacityBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "predictiveScalingMaxCapacityBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPredictiveScalingMaxCapacityBufferInput() {
        return software.amazon.jsii.Kernel.get(this, "predictiveScalingMaxCapacityBufferInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPredictiveScalingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "predictiveScalingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScalableDimensionInput() {
        return software.amazon.jsii.Kernel.get(this, "scalableDimensionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScalingPolicyUpdateBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingPolicyUpdateBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScheduledActionBufferTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduledActionBufferTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceNamespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetTrackingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "targetTrackingConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableDynamicScaling() {
        return software.amazon.jsii.Kernel.get(this, "disableDynamicScaling", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableDynamicScaling(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableDynamicScaling", java.util.Objects.requireNonNull(value, "disableDynamicScaling is required"));
    }

    public void setDisableDynamicScaling(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableDynamicScaling", java.util.Objects.requireNonNull(value, "disableDynamicScaling is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxCapacity() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxCapacity", java.util.Objects.requireNonNull(value, "maxCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinCapacity() {
        return software.amazon.jsii.Kernel.get(this, "minCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minCapacity", java.util.Objects.requireNonNull(value, "minCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPredictiveScalingMaxCapacityBehavior() {
        return software.amazon.jsii.Kernel.get(this, "predictiveScalingMaxCapacityBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPredictiveScalingMaxCapacityBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "predictiveScalingMaxCapacityBehavior", java.util.Objects.requireNonNull(value, "predictiveScalingMaxCapacityBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPredictiveScalingMaxCapacityBuffer() {
        return software.amazon.jsii.Kernel.get(this, "predictiveScalingMaxCapacityBuffer", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPredictiveScalingMaxCapacityBuffer(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "predictiveScalingMaxCapacityBuffer", java.util.Objects.requireNonNull(value, "predictiveScalingMaxCapacityBuffer is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPredictiveScalingMode() {
        return software.amazon.jsii.Kernel.get(this, "predictiveScalingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPredictiveScalingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "predictiveScalingMode", java.util.Objects.requireNonNull(value, "predictiveScalingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceId() {
        return software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceId", java.util.Objects.requireNonNull(value, "resourceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScalableDimension() {
        return software.amazon.jsii.Kernel.get(this, "scalableDimension", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScalableDimension(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scalableDimension", java.util.Objects.requireNonNull(value, "scalableDimension is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScalingPolicyUpdateBehavior() {
        return software.amazon.jsii.Kernel.get(this, "scalingPolicyUpdateBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScalingPolicyUpdateBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scalingPolicyUpdateBehavior", java.util.Objects.requireNonNull(value, "scalingPolicyUpdateBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScheduledActionBufferTime() {
        return software.amazon.jsii.Kernel.get(this, "scheduledActionBufferTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScheduledActionBufferTime(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scheduledActionBufferTime", java.util.Objects.requireNonNull(value, "scheduledActionBufferTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceNamespace() {
        return software.amazon.jsii.Kernel.get(this, "serviceNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceNamespace", java.util.Objects.requireNonNull(value, "serviceNamespace is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstruction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
