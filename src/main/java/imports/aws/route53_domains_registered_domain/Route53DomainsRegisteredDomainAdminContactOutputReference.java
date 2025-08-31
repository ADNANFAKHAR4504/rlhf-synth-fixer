package imports.aws.route53_domains_registered_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.204Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsRegisteredDomain.Route53DomainsRegisteredDomainAdminContactOutputReference")
public class Route53DomainsRegisteredDomainAdminContactOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53DomainsRegisteredDomainAdminContactOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53DomainsRegisteredDomainAdminContactOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Route53DomainsRegisteredDomainAdminContactOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAddressLine1() {
        software.amazon.jsii.Kernel.call(this, "resetAddressLine1", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAddressLine2() {
        software.amazon.jsii.Kernel.call(this, "resetAddressLine2", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCity() {
        software.amazon.jsii.Kernel.call(this, "resetCity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContactType() {
        software.amazon.jsii.Kernel.call(this, "resetContactType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCountryCode() {
        software.amazon.jsii.Kernel.call(this, "resetCountryCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmail() {
        software.amazon.jsii.Kernel.call(this, "resetEmail", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExtraParams() {
        software.amazon.jsii.Kernel.call(this, "resetExtraParams", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFax() {
        software.amazon.jsii.Kernel.call(this, "resetFax", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirstName() {
        software.amazon.jsii.Kernel.call(this, "resetFirstName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastName() {
        software.amazon.jsii.Kernel.call(this, "resetLastName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationName() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPhoneNumber() {
        software.amazon.jsii.Kernel.call(this, "resetPhoneNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetState() {
        software.amazon.jsii.Kernel.call(this, "resetState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetZipCode() {
        software.amazon.jsii.Kernel.call(this, "resetZipCode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressLine1Input() {
        return software.amazon.jsii.Kernel.get(this, "addressLine1Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressLine2Input() {
        return software.amazon.jsii.Kernel.get(this, "addressLine2Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCityInput() {
        return software.amazon.jsii.Kernel.get(this, "cityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContactTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "contactTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCountryCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "countryCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailInput() {
        return software.amazon.jsii.Kernel.get(this, "emailInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getExtraParamsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "extraParamsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFaxInput() {
        return software.amazon.jsii.Kernel.get(this, "faxInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirstNameInput() {
        return software.amazon.jsii.Kernel.get(this, "firstNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLastNameInput() {
        return software.amazon.jsii.Kernel.get(this, "lastNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrganizationNameInput() {
        return software.amazon.jsii.Kernel.get(this, "organizationNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPhoneNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStateInput() {
        return software.amazon.jsii.Kernel.get(this, "stateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getZipCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "zipCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAddressLine1() {
        return software.amazon.jsii.Kernel.get(this, "addressLine1", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAddressLine1(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "addressLine1", java.util.Objects.requireNonNull(value, "addressLine1 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAddressLine2() {
        return software.amazon.jsii.Kernel.get(this, "addressLine2", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAddressLine2(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "addressLine2", java.util.Objects.requireNonNull(value, "addressLine2 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCity() {
        return software.amazon.jsii.Kernel.get(this, "city", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "city", java.util.Objects.requireNonNull(value, "city is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContactType() {
        return software.amazon.jsii.Kernel.get(this, "contactType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContactType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contactType", java.util.Objects.requireNonNull(value, "contactType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCountryCode() {
        return software.amazon.jsii.Kernel.get(this, "countryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCountryCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "countryCode", java.util.Objects.requireNonNull(value, "countryCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmail() {
        return software.amazon.jsii.Kernel.get(this, "email", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmail(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "email", java.util.Objects.requireNonNull(value, "email is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getExtraParams() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "extraParams", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExtraParams(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "extraParams", java.util.Objects.requireNonNull(value, "extraParams is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFax() {
        return software.amazon.jsii.Kernel.get(this, "fax", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFax(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fax", java.util.Objects.requireNonNull(value, "fax is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFirstName() {
        return software.amazon.jsii.Kernel.get(this, "firstName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFirstName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "firstName", java.util.Objects.requireNonNull(value, "firstName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastName() {
        return software.amazon.jsii.Kernel.get(this, "lastName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLastName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lastName", java.util.Objects.requireNonNull(value, "lastName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganizationName() {
        return software.amazon.jsii.Kernel.get(this, "organizationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrganizationName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "organizationName", java.util.Objects.requireNonNull(value, "organizationName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPhoneNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "phoneNumber", java.util.Objects.requireNonNull(value, "phoneNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "state", java.util.Objects.requireNonNull(value, "state is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getZipCode() {
        return software.amazon.jsii.Kernel.get(this, "zipCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setZipCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "zipCode", java.util.Objects.requireNonNull(value, "zipCode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
