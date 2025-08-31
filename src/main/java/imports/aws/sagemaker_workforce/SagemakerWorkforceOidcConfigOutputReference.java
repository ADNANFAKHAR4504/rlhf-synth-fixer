package imports.aws.sagemaker_workforce;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.353Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkforce.SagemakerWorkforceOidcConfigOutputReference")
public class SagemakerWorkforceOidcConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerWorkforceOidcConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerWorkforceOidcConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerWorkforceOidcConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuthenticationRequestExtraParams() {
        software.amazon.jsii.Kernel.call(this, "resetAuthenticationRequestExtraParams", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScope() {
        software.amazon.jsii.Kernel.call(this, "resetScope", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAuthenticationRequestExtraParamsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "authenticationRequestExtraParamsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizationEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clientIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientSecretInput() {
        return software.amazon.jsii.Kernel.get(this, "clientSecretInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIssuerInput() {
        return software.amazon.jsii.Kernel.get(this, "issuerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJwksUriInput() {
        return software.amazon.jsii.Kernel.get(this, "jwksUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogoutEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "logoutEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "scopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTokenEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "tokenEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserInfoEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "userInfoEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getAuthenticationRequestExtraParams() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "authenticationRequestExtraParams", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAuthenticationRequestExtraParams(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "authenticationRequestExtraParams", java.util.Objects.requireNonNull(value, "authenticationRequestExtraParams is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthorizationEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "authorizationEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthorizationEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authorizationEndpoint", java.util.Objects.requireNonNull(value, "authorizationEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientId() {
        return software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientId", java.util.Objects.requireNonNull(value, "clientId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientSecret() {
        return software.amazon.jsii.Kernel.get(this, "clientSecret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientSecret(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientSecret", java.util.Objects.requireNonNull(value, "clientSecret is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIssuer() {
        return software.amazon.jsii.Kernel.get(this, "issuer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIssuer(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "issuer", java.util.Objects.requireNonNull(value, "issuer is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJwksUri() {
        return software.amazon.jsii.Kernel.get(this, "jwksUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJwksUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jwksUri", java.util.Objects.requireNonNull(value, "jwksUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogoutEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "logoutEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogoutEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logoutEndpoint", java.util.Objects.requireNonNull(value, "logoutEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScope() {
        return software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scope", java.util.Objects.requireNonNull(value, "scope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTokenEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "tokenEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTokenEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tokenEndpoint", java.util.Objects.requireNonNull(value, "tokenEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserInfoEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "userInfoEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserInfoEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userInfoEndpoint", java.util.Objects.requireNonNull(value, "userInfoEndpoint is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
