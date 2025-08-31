package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.897Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfigurationOutputReference")
public class AcmpcaCertificateAuthorityRevocationConfigurationOcspConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AcmpcaCertificateAuthorityRevocationConfigurationOcspConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AcmpcaCertificateAuthorityRevocationConfigurationOcspConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AcmpcaCertificateAuthorityRevocationConfigurationOcspConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOcspCustomCname() {
        software.amazon.jsii.Kernel.call(this, "resetOcspCustomCname", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOcspCustomCnameInput() {
        return software.amazon.jsii.Kernel.get(this, "ocspCustomCnameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOcspCustomCname() {
        return software.amazon.jsii.Kernel.get(this, "ocspCustomCname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOcspCustomCname(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ocspCustomCname", java.util.Objects.requireNonNull(value, "ocspCustomCname is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
