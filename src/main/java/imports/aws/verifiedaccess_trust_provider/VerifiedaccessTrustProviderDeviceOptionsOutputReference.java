package imports.aws.verifiedaccess_trust_provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.579Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessTrustProvider.VerifiedaccessTrustProviderDeviceOptionsOutputReference")
public class VerifiedaccessTrustProviderDeviceOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VerifiedaccessTrustProviderDeviceOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedaccessTrustProviderDeviceOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VerifiedaccessTrustProviderDeviceOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetTenantId() {
        software.amazon.jsii.Kernel.call(this, "resetTenantId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTenantIdInput() {
        return software.amazon.jsii.Kernel.get(this, "tenantIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTenantId() {
        return software.amazon.jsii.Kernel.get(this, "tenantId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTenantId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tenantId", java.util.Objects.requireNonNull(value, "tenantId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
