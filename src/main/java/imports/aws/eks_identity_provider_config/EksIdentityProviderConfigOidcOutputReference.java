package imports.aws.eks_identity_provider_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.160Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksIdentityProviderConfig.EksIdentityProviderConfigOidcOutputReference")
public class EksIdentityProviderConfigOidcOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksIdentityProviderConfigOidcOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksIdentityProviderConfigOidcOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksIdentityProviderConfigOidcOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetGroupsClaim() {
        software.amazon.jsii.Kernel.call(this, "resetGroupsClaim", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGroupsPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetGroupsPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequiredClaims() {
        software.amazon.jsii.Kernel.call(this, "resetRequiredClaims", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUsernameClaim() {
        software.amazon.jsii.Kernel.call(this, "resetUsernameClaim", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUsernamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetUsernamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clientIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupsClaimInput() {
        return software.amazon.jsii.Kernel.get(this, "groupsClaimInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupsPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "groupsPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityProviderConfigNameInput() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderConfigNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIssuerUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "issuerUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequiredClaimsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "requiredClaimsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsernameClaimInput() {
        return software.amazon.jsii.Kernel.get(this, "usernameClaimInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsernamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "usernamePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientId() {
        return software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientId", java.util.Objects.requireNonNull(value, "clientId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroupsClaim() {
        return software.amazon.jsii.Kernel.get(this, "groupsClaim", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroupsClaim(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "groupsClaim", java.util.Objects.requireNonNull(value, "groupsClaim is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroupsPrefix() {
        return software.amazon.jsii.Kernel.get(this, "groupsPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroupsPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "groupsPrefix", java.util.Objects.requireNonNull(value, "groupsPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityProviderConfigName() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityProviderConfigName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityProviderConfigName", java.util.Objects.requireNonNull(value, "identityProviderConfigName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIssuerUrl() {
        return software.amazon.jsii.Kernel.get(this, "issuerUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIssuerUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "issuerUrl", java.util.Objects.requireNonNull(value, "issuerUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getRequiredClaims() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "requiredClaims", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRequiredClaims(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "requiredClaims", java.util.Objects.requireNonNull(value, "requiredClaims is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsernameClaim() {
        return software.amazon.jsii.Kernel.get(this, "usernameClaim", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsernameClaim(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "usernameClaim", java.util.Objects.requireNonNull(value, "usernameClaim is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsernamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "usernamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsernamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "usernamePrefix", java.util.Objects.requireNonNull(value, "usernamePrefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_identity_provider_config.EksIdentityProviderConfigOidc getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_identity_provider_config.EksIdentityProviderConfigOidc.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_identity_provider_config.EksIdentityProviderConfigOidc value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
