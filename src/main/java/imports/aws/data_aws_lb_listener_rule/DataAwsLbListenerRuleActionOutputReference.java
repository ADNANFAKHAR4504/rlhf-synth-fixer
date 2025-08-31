package imports.aws.data_aws_lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.735Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLbListenerRule.DataAwsLbListenerRuleActionOutputReference")
public class DataAwsLbListenerRuleActionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsLbListenerRuleActionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsLbListenerRuleActionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsLbListenerRuleActionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putForward(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForward value) {
        software.amazon.jsii.Kernel.call(this, "putForward", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetForward() {
        software.amazon.jsii.Kernel.call(this, "resetForward", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionAuthenticateCognitoOutputReference getAuthenticateCognito() {
        return software.amazon.jsii.Kernel.get(this, "authenticateCognito", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionAuthenticateCognitoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionAuthenticateOidcOutputReference getAuthenticateOidc() {
        return software.amazon.jsii.Kernel.get(this, "authenticateOidc", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionAuthenticateOidcOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionFixedResponseOutputReference getFixedResponse() {
        return software.amazon.jsii.Kernel.get(this, "fixedResponse", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionFixedResponseOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForwardOutputReference getForward() {
        return software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForwardOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOrder() {
        return software.amazon.jsii.Kernel.get(this, "order", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionRedirectOutputReference getRedirect() {
        return software.amazon.jsii.Kernel.get(this, "redirect", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionRedirectOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForwardInput() {
        return software.amazon.jsii.Kernel.get(this, "forwardInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleAction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
