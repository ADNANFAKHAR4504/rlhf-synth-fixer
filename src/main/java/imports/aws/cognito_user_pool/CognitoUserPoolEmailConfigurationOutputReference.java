package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolEmailConfigurationOutputReference")
public class CognitoUserPoolEmailConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolEmailConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolEmailConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolEmailConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConfigurationSet() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurationSet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmailSendingAccount() {
        software.amazon.jsii.Kernel.call(this, "resetEmailSendingAccount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFromEmailAddress() {
        software.amazon.jsii.Kernel.call(this, "resetFromEmailAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplyToEmailAddress() {
        software.amazon.jsii.Kernel.call(this, "resetReplyToEmailAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceArn() {
        software.amazon.jsii.Kernel.call(this, "resetSourceArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationSetInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationSetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailSendingAccountInput() {
        return software.amazon.jsii.Kernel.get(this, "emailSendingAccountInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFromEmailAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "fromEmailAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplyToEmailAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "replyToEmailAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationSet() {
        return software.amazon.jsii.Kernel.get(this, "configurationSet", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationSet(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationSet", java.util.Objects.requireNonNull(value, "configurationSet is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmailSendingAccount() {
        return software.amazon.jsii.Kernel.get(this, "emailSendingAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmailSendingAccount(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emailSendingAccount", java.util.Objects.requireNonNull(value, "emailSendingAccount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFromEmailAddress() {
        return software.amazon.jsii.Kernel.get(this, "fromEmailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFromEmailAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fromEmailAddress", java.util.Objects.requireNonNull(value, "fromEmailAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplyToEmailAddress() {
        return software.amazon.jsii.Kernel.get(this, "replyToEmailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplyToEmailAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replyToEmailAddress", java.util.Objects.requireNonNull(value, "replyToEmailAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceArn", java.util.Objects.requireNonNull(value, "sourceArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
