package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.897Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityRevocationConfigurationOutputReference")
public class AcmpcaCertificateAuthorityRevocationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AcmpcaCertificateAuthorityRevocationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AcmpcaCertificateAuthorityRevocationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AcmpcaCertificateAuthorityRevocationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCrlConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putCrlConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOcspConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putOcspConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCrlConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCrlConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOcspConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetOcspConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfigurationOutputReference getCrlConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "crlConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfigurationOutputReference getOcspConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "ocspConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration getCrlConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "crlConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration getOcspConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "ocspConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
