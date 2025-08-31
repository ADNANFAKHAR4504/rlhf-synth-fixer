package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.679Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleVisibilityConfigOutputReference")
public class Wafv2WebAclRuleVisibilityConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclRuleVisibilityConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclRuleVisibilityConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclRuleVisibilityConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchMetricsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchMetricsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricNameInput() {
        return software.amazon.jsii.Kernel.get(this, "metricNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSampledRequestsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "sampledRequestsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCloudwatchMetricsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchMetricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCloudwatchMetricsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchMetricsEnabled", java.util.Objects.requireNonNull(value, "cloudwatchMetricsEnabled is required"));
    }

    public void setCloudwatchMetricsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchMetricsEnabled", java.util.Objects.requireNonNull(value, "cloudwatchMetricsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricName() {
        return software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricName", java.util.Objects.requireNonNull(value, "metricName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSampledRequestsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "sampledRequestsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSampledRequestsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sampledRequestsEnabled", java.util.Objects.requireNonNull(value, "sampledRequestsEnabled is required"));
    }

    public void setSampledRequestsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sampledRequestsEnabled", java.util.Objects.requireNonNull(value, "sampledRequestsEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
