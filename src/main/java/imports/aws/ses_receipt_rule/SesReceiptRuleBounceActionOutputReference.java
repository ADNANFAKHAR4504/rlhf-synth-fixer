package imports.aws.ses_receipt_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.450Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesReceiptRule.SesReceiptRuleBounceActionOutputReference")
public class SesReceiptRuleBounceActionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SesReceiptRuleBounceActionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SesReceiptRuleBounceActionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SesReceiptRuleBounceActionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetStatusCode() {
        software.amazon.jsii.Kernel.call(this, "resetStatusCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetTopicArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "messageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "positionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSenderInput() {
        return software.amazon.jsii.Kernel.get(this, "senderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSmtpReplyCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "smtpReplyCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "statusCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "topicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessage() {
        return software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "message", java.util.Objects.requireNonNull(value, "message is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPosition() {
        return software.amazon.jsii.Kernel.get(this, "position", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPosition(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "position", java.util.Objects.requireNonNull(value, "position is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSender() {
        return software.amazon.jsii.Kernel.get(this, "sender", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSender(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sender", java.util.Objects.requireNonNull(value, "sender is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSmtpReplyCode() {
        return software.amazon.jsii.Kernel.get(this, "smtpReplyCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSmtpReplyCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "smtpReplyCode", java.util.Objects.requireNonNull(value, "smtpReplyCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatusCode() {
        return software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatusCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statusCode", java.util.Objects.requireNonNull(value, "statusCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "topicArn", java.util.Objects.requireNonNull(value, "topicArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ses_receipt_rule.SesReceiptRuleBounceAction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
