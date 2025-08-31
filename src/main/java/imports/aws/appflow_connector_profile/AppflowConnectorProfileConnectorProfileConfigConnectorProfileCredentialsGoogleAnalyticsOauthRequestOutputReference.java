package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.002Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequestOutputReference")
public class AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequestOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequestOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequestOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequestOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuthCode() {
        software.amazon.jsii.Kernel.call(this, "resetAuthCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedirectUri() {
        software.amazon.jsii.Kernel.call(this, "resetRedirectUri", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "authCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRedirectUriInput() {
        return software.amazon.jsii.Kernel.get(this, "redirectUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthCode() {
        return software.amazon.jsii.Kernel.get(this, "authCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authCode", java.util.Objects.requireNonNull(value, "authCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRedirectUri() {
        return software.amazon.jsii.Kernel.get(this, "redirectUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRedirectUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "redirectUri", java.util.Objects.requireNonNull(value, "redirectUri is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
