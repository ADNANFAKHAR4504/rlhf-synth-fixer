package imports.aws.data_aws_lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.736Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLbListenerRule.DataAwsLbListenerRuleConditionOutputReference")
public class DataAwsLbListenerRuleConditionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsLbListenerRuleConditionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsLbListenerRuleConditionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsLbListenerRuleConditionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putQueryString(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryString value) {
        software.amazon.jsii.Kernel.call(this, "putQueryString", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetQueryString() {
        software.amazon.jsii.Kernel.call(this, "resetQueryString", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionHostHeaderOutputReference getHostHeader() {
        return software.amazon.jsii.Kernel.get(this, "hostHeader", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionHostHeaderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionHttpHeaderOutputReference getHttpHeader() {
        return software.amazon.jsii.Kernel.get(this, "httpHeader", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionHttpHeaderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionHttpRequestMethodOutputReference getHttpRequestMethod() {
        return software.amazon.jsii.Kernel.get(this, "httpRequestMethod", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionHttpRequestMethodOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionPathPatternOutputReference getPathPattern() {
        return software.amazon.jsii.Kernel.get(this, "pathPattern", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionPathPatternOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryStringOutputReference getQueryString() {
        return software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryStringOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionSourceIpOutputReference getSourceIp() {
        return software.amazon.jsii.Kernel.get(this, "sourceIp", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionSourceIpOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getQueryStringInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleCondition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
