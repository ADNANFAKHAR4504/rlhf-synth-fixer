package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.109Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationOutputReference")
public class AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMetricDimension(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricDimension>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricDimension> __cast_cd4240 = (java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricDimension>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricDimension __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMetricDimension", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetrics(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetrics>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetrics> __cast_cd4240 = (java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetrics>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetrics __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMetricDimension() {
        software.amazon.jsii.Kernel.call(this, "resetMetricDimension", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricName() {
        software.amazon.jsii.Kernel.call(this, "resetMetricName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetMetrics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamespace() {
        software.amazon.jsii.Kernel.call(this, "resetNamespace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatistic() {
        software.amazon.jsii.Kernel.call(this, "resetStatistic", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnit() {
        software.amazon.jsii.Kernel.call(this, "resetUnit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricDimensionList getMetricDimension() {
        return software.amazon.jsii.Kernel.get(this, "metricDimension", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricDimensionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsList getMetrics() {
        return software.amazon.jsii.Kernel.get(this, "metrics", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMetricDimensionInput() {
        return software.amazon.jsii.Kernel.get(this, "metricDimensionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricNameInput() {
        return software.amazon.jsii.Kernel.get(this, "metricNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "metricsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "namespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "periodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatisticInput() {
        return software.amazon.jsii.Kernel.get(this, "statisticInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "unitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricName() {
        return software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricName", java.util.Objects.requireNonNull(value, "metricName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespace() {
        return software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namespace", java.util.Objects.requireNonNull(value, "namespace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPeriod() {
        return software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "period", java.util.Objects.requireNonNull(value, "period is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatistic() {
        return software.amazon.jsii.Kernel.get(this, "statistic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatistic(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statistic", java.util.Objects.requireNonNull(value, "statistic is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUnit() {
        return software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "unit", java.util.Objects.requireNonNull(value, "unit is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
