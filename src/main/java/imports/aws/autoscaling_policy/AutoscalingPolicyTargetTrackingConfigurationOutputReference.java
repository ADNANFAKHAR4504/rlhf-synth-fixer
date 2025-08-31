package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.109Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyTargetTrackingConfigurationOutputReference")
public class AutoscalingPolicyTargetTrackingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingPolicyTargetTrackingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingPolicyTargetTrackingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingPolicyTargetTrackingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCustomizedMetricSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCustomizedMetricSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPredefinedMetricSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putPredefinedMetricSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomizedMetricSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCustomizedMetricSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableScaleIn() {
        software.amazon.jsii.Kernel.call(this, "resetDisableScaleIn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPredefinedMetricSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetPredefinedMetricSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationOutputReference getCustomizedMetricSpecification() {
        return software.amazon.jsii.Kernel.get(this, "customizedMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecificationOutputReference getPredefinedMetricSpecification() {
        return software.amazon.jsii.Kernel.get(this, "predefinedMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification getCustomizedMetricSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "customizedMetricSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableScaleInInput() {
        return software.amazon.jsii.Kernel.get(this, "disableScaleInInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification getPredefinedMetricSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "predefinedMetricSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetValue() {
        return software.amazon.jsii.Kernel.get(this, "targetValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetValue(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetValue", java.util.Objects.requireNonNull(value, "targetValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
