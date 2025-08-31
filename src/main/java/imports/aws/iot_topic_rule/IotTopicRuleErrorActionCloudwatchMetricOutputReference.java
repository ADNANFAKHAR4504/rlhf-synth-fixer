package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.415Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorActionCloudwatchMetricOutputReference")
public class IotTopicRuleErrorActionCloudwatchMetricOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotTopicRuleErrorActionCloudwatchMetricOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotTopicRuleErrorActionCloudwatchMetricOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotTopicRuleErrorActionCloudwatchMetricOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMetricTimestamp() {
        software.amazon.jsii.Kernel.call(this, "resetMetricTimestamp", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricNameInput() {
        return software.amazon.jsii.Kernel.get(this, "metricNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "metricNamespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricTimestampInput() {
        return software.amazon.jsii.Kernel.get(this, "metricTimestampInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "metricUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricValueInput() {
        return software.amazon.jsii.Kernel.get(this, "metricValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricName() {
        return software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricName", java.util.Objects.requireNonNull(value, "metricName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricNamespace() {
        return software.amazon.jsii.Kernel.get(this, "metricNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricNamespace", java.util.Objects.requireNonNull(value, "metricNamespace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "metricTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricTimestamp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricTimestamp", java.util.Objects.requireNonNull(value, "metricTimestamp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricUnit() {
        return software.amazon.jsii.Kernel.get(this, "metricUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricUnit", java.util.Objects.requireNonNull(value, "metricUnit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricValue() {
        return software.amazon.jsii.Kernel.get(this, "metricValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricValue", java.util.Objects.requireNonNull(value, "metricValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
