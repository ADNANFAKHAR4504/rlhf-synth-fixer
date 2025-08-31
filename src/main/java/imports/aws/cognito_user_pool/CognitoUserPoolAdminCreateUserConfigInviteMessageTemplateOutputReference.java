package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.350Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplateOutputReference")
public class CognitoUserPoolAdminCreateUserConfigInviteMessageTemplateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolAdminCreateUserConfigInviteMessageTemplateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolAdminCreateUserConfigInviteMessageTemplateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolAdminCreateUserConfigInviteMessageTemplateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEmailMessage() {
        software.amazon.jsii.Kernel.call(this, "resetEmailMessage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmailSubject() {
        software.amazon.jsii.Kernel.call(this, "resetEmailSubject", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSmsMessage() {
        software.amazon.jsii.Kernel.call(this, "resetSmsMessage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "emailMessageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailSubjectInput() {
        return software.amazon.jsii.Kernel.get(this, "emailSubjectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSmsMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "smsMessageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmailMessage() {
        return software.amazon.jsii.Kernel.get(this, "emailMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmailMessage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emailMessage", java.util.Objects.requireNonNull(value, "emailMessage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmailSubject() {
        return software.amazon.jsii.Kernel.get(this, "emailSubject", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmailSubject(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emailSubject", java.util.Objects.requireNonNull(value, "emailSubject is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSmsMessage() {
        return software.amazon.jsii.Kernel.get(this, "smsMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSmsMessage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "smsMessage", java.util.Objects.requireNonNull(value, "smsMessage is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
