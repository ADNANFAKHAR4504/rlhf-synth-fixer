package imports.aws.cognito_risk_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoRiskConfiguration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmailOutputReference")
public class CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmailOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmailOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmailOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmailOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHtmlBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "htmlBodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubjectInput() {
        return software.amazon.jsii.Kernel.get(this, "subjectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTextBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "textBodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHtmlBody() {
        return software.amazon.jsii.Kernel.get(this, "htmlBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHtmlBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "htmlBody", java.util.Objects.requireNonNull(value, "htmlBody is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubject() {
        return software.amazon.jsii.Kernel.get(this, "subject", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubject(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subject", java.util.Objects.requireNonNull(value, "subject is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTextBody() {
        return software.amazon.jsii.Kernel.get(this, "textBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTextBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "textBody", java.util.Objects.requireNonNull(value, "textBody is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
