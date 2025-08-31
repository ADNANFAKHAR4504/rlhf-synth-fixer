package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.896Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationOutputReference")
public class AcmpcaCertificateAuthorityCertificateAuthorityConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AcmpcaCertificateAuthorityCertificateAuthorityConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AcmpcaCertificateAuthorityCertificateAuthorityConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AcmpcaCertificateAuthorityCertificateAuthorityConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSubject(final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject value) {
        software.amazon.jsii.Kernel.call(this, "putSubject", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubjectOutputReference getSubject() {
        return software.amazon.jsii.Kernel.get(this, "subject", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubjectOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "keyAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSigningAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "signingAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject getSubjectInput() {
        return software.amazon.jsii.Kernel.get(this, "subjectInput", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "keyAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyAlgorithm", java.util.Objects.requireNonNull(value, "keyAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "signingAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSigningAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "signingAlgorithm", java.util.Objects.requireNonNull(value, "signingAlgorithm is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
