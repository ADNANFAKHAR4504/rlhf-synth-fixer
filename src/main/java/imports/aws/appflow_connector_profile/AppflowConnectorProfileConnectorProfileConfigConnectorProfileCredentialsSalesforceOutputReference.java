package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.003Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOutputReference")
public class AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putOauthRequest(final @org.jetbrains.annotations.NotNull imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest value) {
        software.amazon.jsii.Kernel.call(this, "putOauthRequest", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessToken() {
        software.amazon.jsii.Kernel.call(this, "resetAccessToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientCredentialsArn() {
        software.amazon.jsii.Kernel.call(this, "resetClientCredentialsArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJwtToken() {
        software.amazon.jsii.Kernel.call(this, "resetJwtToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOauth2GrantType() {
        software.amazon.jsii.Kernel.call(this, "resetOauth2GrantType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOauthRequest() {
        software.amazon.jsii.Kernel.call(this, "resetOauthRequest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRefreshToken() {
        software.amazon.jsii.Kernel.call(this, "resetRefreshToken", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequestOutputReference getOauthRequest() {
        return software.amazon.jsii.Kernel.get(this, "oauthRequest", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequestOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "accessTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientCredentialsArnInput() {
        return software.amazon.jsii.Kernel.get(this, "clientCredentialsArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJwtTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "jwtTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOauth2GrantTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "oauth2GrantTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest getOauthRequestInput() {
        return software.amazon.jsii.Kernel.get(this, "oauthRequestInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRefreshTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "refreshTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessToken() {
        return software.amazon.jsii.Kernel.get(this, "accessToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessToken", java.util.Objects.requireNonNull(value, "accessToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientCredentialsArn() {
        return software.amazon.jsii.Kernel.get(this, "clientCredentialsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientCredentialsArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientCredentialsArn", java.util.Objects.requireNonNull(value, "clientCredentialsArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJwtToken() {
        return software.amazon.jsii.Kernel.get(this, "jwtToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJwtToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jwtToken", java.util.Objects.requireNonNull(value, "jwtToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOauth2GrantType() {
        return software.amazon.jsii.Kernel.get(this, "oauth2GrantType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOauth2GrantType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "oauth2GrantType", java.util.Objects.requireNonNull(value, "oauth2GrantType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRefreshToken() {
        return software.amazon.jsii.Kernel.get(this, "refreshToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRefreshToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "refreshToken", java.util.Objects.requireNonNull(value, "refreshToken is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
