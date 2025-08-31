package imports.aws.alb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.911Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albListenerRule.AlbListenerRuleActionFixedResponseOutputReference")
public class AlbListenerRuleActionFixedResponseOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AlbListenerRuleActionFixedResponseOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AlbListenerRuleActionFixedResponseOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AlbListenerRuleActionFixedResponseOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMessageBody() {
        software.amazon.jsii.Kernel.call(this, "resetMessageBody", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatusCode() {
        software.amazon.jsii.Kernel.call(this, "resetStatusCode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "contentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "messageBodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "statusCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentType() {
        return software.amazon.jsii.Kernel.get(this, "contentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentType", java.util.Objects.requireNonNull(value, "contentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageBody() {
        return software.amazon.jsii.Kernel.get(this, "messageBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageBody", java.util.Objects.requireNonNull(value, "messageBody is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatusCode() {
        return software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatusCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statusCode", java.util.Objects.requireNonNull(value, "statusCode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleActionFixedResponse getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleActionFixedResponse.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleActionFixedResponse value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
