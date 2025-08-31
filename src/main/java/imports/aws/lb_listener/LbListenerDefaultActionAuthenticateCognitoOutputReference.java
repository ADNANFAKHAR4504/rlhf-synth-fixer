package imports.aws.lb_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.529Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListener.LbListenerDefaultActionAuthenticateCognitoOutputReference")
public class LbListenerDefaultActionAuthenticateCognitoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LbListenerDefaultActionAuthenticateCognitoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbListenerDefaultActionAuthenticateCognitoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LbListenerDefaultActionAuthenticateCognitoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuthenticationRequestExtraParams() {
        software.amazon.jsii.Kernel.call(this, "resetAuthenticationRequestExtraParams", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnUnauthenticatedRequest() {
        software.amazon.jsii.Kernel.call(this, "resetOnUnauthenticatedRequest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScope() {
        software.amazon.jsii.Kernel.call(this, "resetScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSessionCookieName() {
        software.amazon.jsii.Kernel.call(this, "resetSessionCookieName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSessionTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetSessionTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAuthenticationRequestExtraParamsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "authenticationRequestExtraParamsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnUnauthenticatedRequestInput() {
        return software.amazon.jsii.Kernel.get(this, "onUnauthenticatedRequestInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "scopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSessionCookieNameInput() {
        return software.amazon.jsii.Kernel.get(this, "sessionCookieNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSessionTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "sessionTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserPoolArnInput() {
        return software.amazon.jsii.Kernel.get(this, "userPoolArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserPoolClientIdInput() {
        return software.amazon.jsii.Kernel.get(this, "userPoolClientIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserPoolDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "userPoolDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getAuthenticationRequestExtraParams() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "authenticationRequestExtraParams", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAuthenticationRequestExtraParams(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "authenticationRequestExtraParams", java.util.Objects.requireNonNull(value, "authenticationRequestExtraParams is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnUnauthenticatedRequest() {
        return software.amazon.jsii.Kernel.get(this, "onUnauthenticatedRequest", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnUnauthenticatedRequest(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onUnauthenticatedRequest", java.util.Objects.requireNonNull(value, "onUnauthenticatedRequest is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScope() {
        return software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scope", java.util.Objects.requireNonNull(value, "scope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSessionCookieName() {
        return software.amazon.jsii.Kernel.get(this, "sessionCookieName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSessionCookieName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sessionCookieName", java.util.Objects.requireNonNull(value, "sessionCookieName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSessionTimeout() {
        return software.amazon.jsii.Kernel.get(this, "sessionTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSessionTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sessionTimeout", java.util.Objects.requireNonNull(value, "sessionTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserPoolArn() {
        return software.amazon.jsii.Kernel.get(this, "userPoolArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserPoolArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userPoolArn", java.util.Objects.requireNonNull(value, "userPoolArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserPoolClientId() {
        return software.amazon.jsii.Kernel.get(this, "userPoolClientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserPoolClientId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userPoolClientId", java.util.Objects.requireNonNull(value, "userPoolClientId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserPoolDomain() {
        return software.amazon.jsii.Kernel.get(this, "userPoolDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserPoolDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userPoolDomain", java.util.Objects.requireNonNull(value, "userPoolDomain is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
