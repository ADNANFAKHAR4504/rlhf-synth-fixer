package imports.aws.ec2_client_vpn_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.072Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2ClientVpnEndpoint.Ec2ClientVpnEndpointAuthenticationOptionsOutputReference")
public class Ec2ClientVpnEndpointAuthenticationOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2ClientVpnEndpointAuthenticationOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2ClientVpnEndpointAuthenticationOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Ec2ClientVpnEndpointAuthenticationOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetActiveDirectoryId() {
        software.amazon.jsii.Kernel.call(this, "resetActiveDirectoryId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootCertificateChainArn() {
        software.amazon.jsii.Kernel.call(this, "resetRootCertificateChainArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSamlProviderArn() {
        software.amazon.jsii.Kernel.call(this, "resetSamlProviderArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSelfServiceSamlProviderArn() {
        software.amazon.jsii.Kernel.call(this, "resetSelfServiceSamlProviderArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActiveDirectoryIdInput() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRootCertificateChainArnInput() {
        return software.amazon.jsii.Kernel.get(this, "rootCertificateChainArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSamlProviderArnInput() {
        return software.amazon.jsii.Kernel.get(this, "samlProviderArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSelfServiceSamlProviderArnInput() {
        return software.amazon.jsii.Kernel.get(this, "selfServiceSamlProviderArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActiveDirectoryId() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setActiveDirectoryId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "activeDirectoryId", java.util.Objects.requireNonNull(value, "activeDirectoryId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootCertificateChainArn() {
        return software.amazon.jsii.Kernel.get(this, "rootCertificateChainArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRootCertificateChainArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rootCertificateChainArn", java.util.Objects.requireNonNull(value, "rootCertificateChainArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSamlProviderArn() {
        return software.amazon.jsii.Kernel.get(this, "samlProviderArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSamlProviderArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "samlProviderArn", java.util.Objects.requireNonNull(value, "samlProviderArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSelfServiceSamlProviderArn() {
        return software.amazon.jsii.Kernel.get(this, "selfServiceSamlProviderArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSelfServiceSamlProviderArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "selfServiceSamlProviderArn", java.util.Objects.requireNonNull(value, "selfServiceSamlProviderArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointAuthenticationOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
