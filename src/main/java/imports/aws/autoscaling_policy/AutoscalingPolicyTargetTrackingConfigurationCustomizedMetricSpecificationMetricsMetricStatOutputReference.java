package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.109Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatOutputReference")
public class AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMetric(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatMetric value) {
        software.amazon.jsii.Kernel.call(this, "putMetric", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnit() {
        software.amazon.jsii.Kernel.call(this, "resetUnit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatMetricOutputReference getMetric() {
        return software.amazon.jsii.Kernel.get(this, "metric", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatMetricOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatMetric getMetricInput() {
        return software.amazon.jsii.Kernel.get(this, "metricInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStatMetric.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "periodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatInput() {
        return software.amazon.jsii.Kernel.get(this, "statInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "unitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPeriod() {
        return software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "period", java.util.Objects.requireNonNull(value, "period is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStat() {
        return software.amazon.jsii.Kernel.get(this, "stat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stat", java.util.Objects.requireNonNull(value, "stat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUnit() {
        return software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "unit", java.util.Objects.requireNonNull(value, "unit is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStat getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStat.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsMetricStat value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
