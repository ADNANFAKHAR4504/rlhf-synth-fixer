package imports.aws.ssoadmin_trusted_token_issuer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.526Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminTrustedTokenIssuer.SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfigurationOutputReference")
public class SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClaimAttributePathInput() {
        return software.amazon.jsii.Kernel.get(this, "claimAttributePathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityStoreAttributePathInput() {
        return software.amazon.jsii.Kernel.get(this, "identityStoreAttributePathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIssuerUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "issuerUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJwksRetrievalOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "jwksRetrievalOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClaimAttributePath() {
        return software.amazon.jsii.Kernel.get(this, "claimAttributePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClaimAttributePath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "claimAttributePath", java.util.Objects.requireNonNull(value, "claimAttributePath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityStoreAttributePath() {
        return software.amazon.jsii.Kernel.get(this, "identityStoreAttributePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityStoreAttributePath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityStoreAttributePath", java.util.Objects.requireNonNull(value, "identityStoreAttributePath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIssuerUrl() {
        return software.amazon.jsii.Kernel.get(this, "issuerUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIssuerUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "issuerUrl", java.util.Objects.requireNonNull(value, "issuerUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJwksRetrievalOption() {
        return software.amazon.jsii.Kernel.get(this, "jwksRetrievalOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJwksRetrievalOption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jwksRetrievalOption", java.util.Objects.requireNonNull(value, "jwksRetrievalOption is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssoadmin_trusted_token_issuer.SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
