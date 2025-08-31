package imports.aws.data_aws_route53_traffic_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.841Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRuleSecondaryOutputReference")
public class DataAwsRoute53TrafficPolicyDocumentRuleSecondaryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsRoute53TrafficPolicyDocumentRuleSecondaryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRoute53TrafficPolicyDocumentRuleSecondaryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsRoute53TrafficPolicyDocumentRuleSecondaryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEndpointReference() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointReference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEvaluateTargetHealth() {
        software.amazon.jsii.Kernel.call(this, "resetEvaluateTargetHealth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheck() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuleReference() {
        software.amazon.jsii.Kernel.call(this, "resetRuleReference", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointReferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEvaluateTargetHealthInput() {
        return software.amazon.jsii.Kernel.get(this, "evaluateTargetHealthInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuleReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleReferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointReference() {
        return software.amazon.jsii.Kernel.get(this, "endpointReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointReference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointReference", java.util.Objects.requireNonNull(value, "endpointReference is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEvaluateTargetHealth() {
        return software.amazon.jsii.Kernel.get(this, "evaluateTargetHealth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEvaluateTargetHealth(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "evaluateTargetHealth", java.util.Objects.requireNonNull(value, "evaluateTargetHealth is required"));
    }

    public void setEvaluateTargetHealth(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "evaluateTargetHealth", java.util.Objects.requireNonNull(value, "evaluateTargetHealth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHealthCheck() {
        return software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHealthCheck(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "healthCheck", java.util.Objects.requireNonNull(value, "healthCheck is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuleReference() {
        return software.amazon.jsii.Kernel.get(this, "ruleReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuleReference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ruleReference", java.util.Objects.requireNonNull(value, "ruleReference is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
