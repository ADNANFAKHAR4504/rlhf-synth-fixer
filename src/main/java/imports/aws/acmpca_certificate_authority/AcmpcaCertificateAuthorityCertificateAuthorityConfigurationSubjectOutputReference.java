package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.896Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubjectOutputReference")
public class AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubjectOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubjectOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubjectOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubjectOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCommonName() {
        software.amazon.jsii.Kernel.call(this, "resetCommonName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCountry() {
        software.amazon.jsii.Kernel.call(this, "resetCountry", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDistinguishedNameQualifier() {
        software.amazon.jsii.Kernel.call(this, "resetDistinguishedNameQualifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGenerationQualifier() {
        software.amazon.jsii.Kernel.call(this, "resetGenerationQualifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGivenName() {
        software.amazon.jsii.Kernel.call(this, "resetGivenName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitials() {
        software.amazon.jsii.Kernel.call(this, "resetInitials", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocality() {
        software.amazon.jsii.Kernel.call(this, "resetLocality", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganization() {
        software.amazon.jsii.Kernel.call(this, "resetOrganization", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationalUnit() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationalUnit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPseudonym() {
        software.amazon.jsii.Kernel.call(this, "resetPseudonym", software.amazon.jsii.NativeType.VOID);
    }

    public void resetState() {
        software.amazon.jsii.Kernel.call(this, "resetState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSurname() {
        software.amazon.jsii.Kernel.call(this, "resetSurname", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTitle() {
        software.amazon.jsii.Kernel.call(this, "resetTitle", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCommonNameInput() {
        return software.amazon.jsii.Kernel.get(this, "commonNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCountryInput() {
        return software.amazon.jsii.Kernel.get(this, "countryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDistinguishedNameQualifierInput() {
        return software.amazon.jsii.Kernel.get(this, "distinguishedNameQualifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGenerationQualifierInput() {
        return software.amazon.jsii.Kernel.get(this, "generationQualifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGivenNameInput() {
        return software.amazon.jsii.Kernel.get(this, "givenNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInitialsInput() {
        return software.amazon.jsii.Kernel.get(this, "initialsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalityInput() {
        return software.amazon.jsii.Kernel.get(this, "localityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrganizationalUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "organizationalUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrganizationInput() {
        return software.amazon.jsii.Kernel.get(this, "organizationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPseudonymInput() {
        return software.amazon.jsii.Kernel.get(this, "pseudonymInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStateInput() {
        return software.amazon.jsii.Kernel.get(this, "stateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSurnameInput() {
        return software.amazon.jsii.Kernel.get(this, "surnameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTitleInput() {
        return software.amazon.jsii.Kernel.get(this, "titleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCommonName() {
        return software.amazon.jsii.Kernel.get(this, "commonName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCommonName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "commonName", java.util.Objects.requireNonNull(value, "commonName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCountry() {
        return software.amazon.jsii.Kernel.get(this, "country", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCountry(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "country", java.util.Objects.requireNonNull(value, "country is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDistinguishedNameQualifier() {
        return software.amazon.jsii.Kernel.get(this, "distinguishedNameQualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDistinguishedNameQualifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "distinguishedNameQualifier", java.util.Objects.requireNonNull(value, "distinguishedNameQualifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGenerationQualifier() {
        return software.amazon.jsii.Kernel.get(this, "generationQualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGenerationQualifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "generationQualifier", java.util.Objects.requireNonNull(value, "generationQualifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGivenName() {
        return software.amazon.jsii.Kernel.get(this, "givenName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGivenName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "givenName", java.util.Objects.requireNonNull(value, "givenName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInitials() {
        return software.amazon.jsii.Kernel.get(this, "initials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInitials(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "initials", java.util.Objects.requireNonNull(value, "initials is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocality() {
        return software.amazon.jsii.Kernel.get(this, "locality", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocality(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "locality", java.util.Objects.requireNonNull(value, "locality is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganization() {
        return software.amazon.jsii.Kernel.get(this, "organization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrganization(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "organization", java.util.Objects.requireNonNull(value, "organization is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganizationalUnit() {
        return software.amazon.jsii.Kernel.get(this, "organizationalUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrganizationalUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "organizationalUnit", java.util.Objects.requireNonNull(value, "organizationalUnit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPseudonym() {
        return software.amazon.jsii.Kernel.get(this, "pseudonym", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPseudonym(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pseudonym", java.util.Objects.requireNonNull(value, "pseudonym is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "state", java.util.Objects.requireNonNull(value, "state is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSurname() {
        return software.amazon.jsii.Kernel.get(this, "surname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSurname(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "surname", java.util.Objects.requireNonNull(value, "surname is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTitle(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "title", java.util.Objects.requireNonNull(value, "title is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
