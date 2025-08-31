package imports.aws.cognito_risk_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoRiskConfiguration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationOutputReference")
public class CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBlockEmail(final @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail value) {
        software.amazon.jsii.Kernel.call(this, "putBlockEmail", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMfaEmail(final @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail value) {
        software.amazon.jsii.Kernel.call(this, "putMfaEmail", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNoActionEmail(final @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail value) {
        software.amazon.jsii.Kernel.call(this, "putNoActionEmail", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBlockEmail() {
        software.amazon.jsii.Kernel.call(this, "resetBlockEmail", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFrom() {
        software.amazon.jsii.Kernel.call(this, "resetFrom", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMfaEmail() {
        software.amazon.jsii.Kernel.call(this, "resetMfaEmail", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoActionEmail() {
        software.amazon.jsii.Kernel.call(this, "resetNoActionEmail", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplyTo() {
        software.amazon.jsii.Kernel.call(this, "resetReplyTo", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmailOutputReference getBlockEmail() {
        return software.amazon.jsii.Kernel.get(this, "blockEmail", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmailOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmailOutputReference getMfaEmail() {
        return software.amazon.jsii.Kernel.get(this, "mfaEmail", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmailOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmailOutputReference getNoActionEmail() {
        return software.amazon.jsii.Kernel.get(this, "noActionEmail", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmailOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail getBlockEmailInput() {
        return software.amazon.jsii.Kernel.get(this, "blockEmailInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFromInput() {
        return software.amazon.jsii.Kernel.get(this, "fromInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail getMfaEmailInput() {
        return software.amazon.jsii.Kernel.get(this, "mfaEmailInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail getNoActionEmailInput() {
        return software.amazon.jsii.Kernel.get(this, "noActionEmailInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplyToInput() {
        return software.amazon.jsii.Kernel.get(this, "replyToInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFrom() {
        return software.amazon.jsii.Kernel.get(this, "from", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFrom(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "from", java.util.Objects.requireNonNull(value, "from is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplyTo() {
        return software.amazon.jsii.Kernel.get(this, "replyTo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplyTo(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replyTo", java.util.Objects.requireNonNull(value, "replyTo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceArn", java.util.Objects.requireNonNull(value, "sourceArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
