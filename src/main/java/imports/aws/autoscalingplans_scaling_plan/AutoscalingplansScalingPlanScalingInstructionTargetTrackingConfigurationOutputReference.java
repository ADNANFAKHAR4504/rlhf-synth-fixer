package imports.aws.autoscalingplans_scaling_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationOutputReference")
public class AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCustomizedScalingMetricSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCustomizedScalingMetricSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPredefinedScalingMetricSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putPredefinedScalingMetricSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomizedScalingMetricSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCustomizedScalingMetricSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableScaleIn() {
        software.amazon.jsii.Kernel.call(this, "resetDisableScaleIn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEstimatedInstanceWarmup() {
        software.amazon.jsii.Kernel.call(this, "resetEstimatedInstanceWarmup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPredefinedScalingMetricSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetPredefinedScalingMetricSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScaleInCooldown() {
        software.amazon.jsii.Kernel.call(this, "resetScaleInCooldown", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScaleOutCooldown() {
        software.amazon.jsii.Kernel.call(this, "resetScaleOutCooldown", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecificationOutputReference getCustomizedScalingMetricSpecification() {
        return software.amazon.jsii.Kernel.get(this, "customizedScalingMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecificationOutputReference getPredefinedScalingMetricSpecification() {
        return software.amazon.jsii.Kernel.get(this, "predefinedScalingMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification getCustomizedScalingMetricSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "customizedScalingMetricSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableScaleInInput() {
        return software.amazon.jsii.Kernel.get(this, "disableScaleInInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getEstimatedInstanceWarmupInput() {
        return software.amazon.jsii.Kernel.get(this, "estimatedInstanceWarmupInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification getPredefinedScalingMetricSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "predefinedScalingMetricSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScaleInCooldownInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleInCooldownInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScaleOutCooldownInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleOutCooldownInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetValueInput() {
        return software.amazon.jsii.Kernel.get(this, "targetValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableScaleIn() {
        return software.amazon.jsii.Kernel.get(this, "disableScaleIn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableScaleIn(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableScaleIn", java.util.Objects.requireNonNull(value, "disableScaleIn is required"));
    }

    public void setDisableScaleIn(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableScaleIn", java.util.Objects.requireNonNull(value, "disableScaleIn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEstimatedInstanceWarmup() {
        return software.amazon.jsii.Kernel.get(this, "estimatedInstanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setEstimatedInstanceWarmup(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "estimatedInstanceWarmup", java.util.Objects.requireNonNull(value, "estimatedInstanceWarmup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScaleInCooldown() {
        return software.amazon.jsii.Kernel.get(this, "scaleInCooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScaleInCooldown(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scaleInCooldown", java.util.Objects.requireNonNull(value, "scaleInCooldown is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScaleOutCooldown() {
        return software.amazon.jsii.Kernel.get(this, "scaleOutCooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScaleOutCooldown(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scaleOutCooldown", java.util.Objects.requireNonNull(value, "scaleOutCooldown is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetValue() {
        return software.amazon.jsii.Kernel.get(this, "targetValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetValue(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetValue", java.util.Objects.requireNonNull(value, "targetValue is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
