package imports.aws.customerprofiles_profile;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile aws_customerprofiles_profile}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.404Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesProfile.CustomerprofilesProfile")
public class CustomerprofilesProfile extends com.hashicorp.cdktf.TerraformResource {

    protected CustomerprofilesProfile(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesProfile(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.customerprofiles_profile.CustomerprofilesProfile.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile aws_customerprofiles_profile} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CustomerprofilesProfile(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CustomerprofilesProfile resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CustomerprofilesProfile to import. This parameter is required.
     * @param importFromId The id of the existing CustomerprofilesProfile that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CustomerprofilesProfile to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.customerprofiles_profile.CustomerprofilesProfile.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CustomerprofilesProfile resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CustomerprofilesProfile to import. This parameter is required.
     * @param importFromId The id of the existing CustomerprofilesProfile that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.customerprofiles_profile.CustomerprofilesProfile.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAddress(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress value) {
        software.amazon.jsii.Kernel.call(this, "putAddress", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBillingAddress(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress value) {
        software.amazon.jsii.Kernel.call(this, "putBillingAddress", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMailingAddress(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress value) {
        software.amazon.jsii.Kernel.call(this, "putMailingAddress", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putShippingAddress(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress value) {
        software.amazon.jsii.Kernel.call(this, "putShippingAddress", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccountNumber() {
        software.amazon.jsii.Kernel.call(this, "resetAccountNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdditionalInformation() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalInformation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBillingAddress() {
        software.amazon.jsii.Kernel.call(this, "resetBillingAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBirthDate() {
        software.amazon.jsii.Kernel.call(this, "resetBirthDate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBusinessEmailAddress() {
        software.amazon.jsii.Kernel.call(this, "resetBusinessEmailAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBusinessName() {
        software.amazon.jsii.Kernel.call(this, "resetBusinessName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBusinessPhoneNumber() {
        software.amazon.jsii.Kernel.call(this, "resetBusinessPhoneNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmailAddress() {
        software.amazon.jsii.Kernel.call(this, "resetEmailAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirstName() {
        software.amazon.jsii.Kernel.call(this, "resetFirstName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGenderString() {
        software.amazon.jsii.Kernel.call(this, "resetGenderString", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHomePhoneNumber() {
        software.amazon.jsii.Kernel.call(this, "resetHomePhoneNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastName() {
        software.amazon.jsii.Kernel.call(this, "resetLastName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMailingAddress() {
        software.amazon.jsii.Kernel.call(this, "resetMailingAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMiddleName() {
        software.amazon.jsii.Kernel.call(this, "resetMiddleName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMobilePhoneNumber() {
        software.amazon.jsii.Kernel.call(this, "resetMobilePhoneNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPartyTypeString() {
        software.amazon.jsii.Kernel.call(this, "resetPartyTypeString", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPersonalEmailAddress() {
        software.amazon.jsii.Kernel.call(this, "resetPersonalEmailAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPhoneNumber() {
        software.amazon.jsii.Kernel.call(this, "resetPhoneNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShippingAddress() {
        software.amazon.jsii.Kernel.call(this, "resetShippingAddress", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileAddressOutputReference getAddress() {
        return software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileAddressOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddressOutputReference getBillingAddress() {
        return software.amazon.jsii.Kernel.get(this, "billingAddress", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddressOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddressOutputReference getMailingAddress() {
        return software.amazon.jsii.Kernel.get(this, "mailingAddress", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddressOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddressOutputReference getShippingAddress() {
        return software.amazon.jsii.Kernel.get(this, "shippingAddress", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddressOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "accountNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdditionalInformationInput() {
        return software.amazon.jsii.Kernel.get(this, "additionalInformationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress getAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "addressInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAttributesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "attributesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress getBillingAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "billingAddressInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBirthDateInput() {
        return software.amazon.jsii.Kernel.get(this, "birthDateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBusinessEmailAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "businessEmailAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBusinessNameInput() {
        return software.amazon.jsii.Kernel.get(this, "businessNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBusinessPhoneNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "businessPhoneNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "emailAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirstNameInput() {
        return software.amazon.jsii.Kernel.get(this, "firstNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGenderStringInput() {
        return software.amazon.jsii.Kernel.get(this, "genderStringInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHomePhoneNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "homePhoneNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLastNameInput() {
        return software.amazon.jsii.Kernel.get(this, "lastNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress getMailingAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "mailingAddressInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMiddleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "middleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMobilePhoneNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "mobilePhoneNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPartyTypeStringInput() {
        return software.amazon.jsii.Kernel.get(this, "partyTypeStringInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPersonalEmailAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "personalEmailAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPhoneNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress getShippingAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "shippingAddressInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountNumber() {
        return software.amazon.jsii.Kernel.get(this, "accountNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountNumber", java.util.Objects.requireNonNull(value, "accountNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdditionalInformation() {
        return software.amazon.jsii.Kernel.get(this, "additionalInformation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdditionalInformation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "additionalInformation", java.util.Objects.requireNonNull(value, "additionalInformation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "attributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAttributes(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "attributes", java.util.Objects.requireNonNull(value, "attributes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBirthDate() {
        return software.amazon.jsii.Kernel.get(this, "birthDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBirthDate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "birthDate", java.util.Objects.requireNonNull(value, "birthDate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBusinessEmailAddress() {
        return software.amazon.jsii.Kernel.get(this, "businessEmailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBusinessEmailAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "businessEmailAddress", java.util.Objects.requireNonNull(value, "businessEmailAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBusinessName() {
        return software.amazon.jsii.Kernel.get(this, "businessName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBusinessName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "businessName", java.util.Objects.requireNonNull(value, "businessName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBusinessPhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "businessPhoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBusinessPhoneNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "businessPhoneNumber", java.util.Objects.requireNonNull(value, "businessPhoneNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainName", java.util.Objects.requireNonNull(value, "domainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmailAddress() {
        return software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmailAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emailAddress", java.util.Objects.requireNonNull(value, "emailAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFirstName() {
        return software.amazon.jsii.Kernel.get(this, "firstName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFirstName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "firstName", java.util.Objects.requireNonNull(value, "firstName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGenderString() {
        return software.amazon.jsii.Kernel.get(this, "genderString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGenderString(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "genderString", java.util.Objects.requireNonNull(value, "genderString is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHomePhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "homePhoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHomePhoneNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "homePhoneNumber", java.util.Objects.requireNonNull(value, "homePhoneNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastName() {
        return software.amazon.jsii.Kernel.get(this, "lastName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLastName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lastName", java.util.Objects.requireNonNull(value, "lastName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMiddleName() {
        return software.amazon.jsii.Kernel.get(this, "middleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMiddleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "middleName", java.util.Objects.requireNonNull(value, "middleName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMobilePhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "mobilePhoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMobilePhoneNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mobilePhoneNumber", java.util.Objects.requireNonNull(value, "mobilePhoneNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPartyTypeString() {
        return software.amazon.jsii.Kernel.get(this, "partyTypeString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPartyTypeString(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "partyTypeString", java.util.Objects.requireNonNull(value, "partyTypeString is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPersonalEmailAddress() {
        return software.amazon.jsii.Kernel.get(this, "personalEmailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPersonalEmailAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "personalEmailAddress", java.util.Objects.requireNonNull(value, "personalEmailAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPhoneNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "phoneNumber", java.util.Objects.requireNonNull(value, "phoneNumber is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.customerprofiles_profile.CustomerprofilesProfile}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.customerprofiles_profile.CustomerprofilesProfile> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.customerprofiles_profile.CustomerprofilesProfileConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.customerprofiles_profile.CustomerprofilesProfileConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#domain_name CustomerprofilesProfile#domain_name}.
         * <p>
         * @return {@code this}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#domain_name CustomerprofilesProfile#domain_name}. This parameter is required.
         */
        public Builder domainName(final java.lang.String domainName) {
            this.config.domainName(domainName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#account_number CustomerprofilesProfile#account_number}.
         * <p>
         * @return {@code this}
         * @param accountNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#account_number CustomerprofilesProfile#account_number}. This parameter is required.
         */
        public Builder accountNumber(final java.lang.String accountNumber) {
            this.config.accountNumber(accountNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#additional_information CustomerprofilesProfile#additional_information}.
         * <p>
         * @return {@code this}
         * @param additionalInformation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#additional_information CustomerprofilesProfile#additional_information}. This parameter is required.
         */
        public Builder additionalInformation(final java.lang.String additionalInformation) {
            this.config.additionalInformation(additionalInformation);
            return this;
        }

        /**
         * address block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address CustomerprofilesProfile#address}
         * <p>
         * @return {@code this}
         * @param address address block. This parameter is required.
         */
        public Builder address(final imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress address) {
            this.config.address(address);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#attributes CustomerprofilesProfile#attributes}.
         * <p>
         * @return {@code this}
         * @param attributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#attributes CustomerprofilesProfile#attributes}. This parameter is required.
         */
        public Builder attributes(final java.util.Map<java.lang.String, java.lang.String> attributes) {
            this.config.attributes(attributes);
            return this;
        }

        /**
         * billing_address block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#billing_address CustomerprofilesProfile#billing_address}
         * <p>
         * @return {@code this}
         * @param billingAddress billing_address block. This parameter is required.
         */
        public Builder billingAddress(final imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress billingAddress) {
            this.config.billingAddress(billingAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#birth_date CustomerprofilesProfile#birth_date}.
         * <p>
         * @return {@code this}
         * @param birthDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#birth_date CustomerprofilesProfile#birth_date}. This parameter is required.
         */
        public Builder birthDate(final java.lang.String birthDate) {
            this.config.birthDate(birthDate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_email_address CustomerprofilesProfile#business_email_address}.
         * <p>
         * @return {@code this}
         * @param businessEmailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_email_address CustomerprofilesProfile#business_email_address}. This parameter is required.
         */
        public Builder businessEmailAddress(final java.lang.String businessEmailAddress) {
            this.config.businessEmailAddress(businessEmailAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_name CustomerprofilesProfile#business_name}.
         * <p>
         * @return {@code this}
         * @param businessName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_name CustomerprofilesProfile#business_name}. This parameter is required.
         */
        public Builder businessName(final java.lang.String businessName) {
            this.config.businessName(businessName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_phone_number CustomerprofilesProfile#business_phone_number}.
         * <p>
         * @return {@code this}
         * @param businessPhoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_phone_number CustomerprofilesProfile#business_phone_number}. This parameter is required.
         */
        public Builder businessPhoneNumber(final java.lang.String businessPhoneNumber) {
            this.config.businessPhoneNumber(businessPhoneNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#email_address CustomerprofilesProfile#email_address}.
         * <p>
         * @return {@code this}
         * @param emailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#email_address CustomerprofilesProfile#email_address}. This parameter is required.
         */
        public Builder emailAddress(final java.lang.String emailAddress) {
            this.config.emailAddress(emailAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#first_name CustomerprofilesProfile#first_name}.
         * <p>
         * @return {@code this}
         * @param firstName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#first_name CustomerprofilesProfile#first_name}. This parameter is required.
         */
        public Builder firstName(final java.lang.String firstName) {
            this.config.firstName(firstName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#gender_string CustomerprofilesProfile#gender_string}.
         * <p>
         * @return {@code this}
         * @param genderString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#gender_string CustomerprofilesProfile#gender_string}. This parameter is required.
         */
        public Builder genderString(final java.lang.String genderString) {
            this.config.genderString(genderString);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#home_phone_number CustomerprofilesProfile#home_phone_number}.
         * <p>
         * @return {@code this}
         * @param homePhoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#home_phone_number CustomerprofilesProfile#home_phone_number}. This parameter is required.
         */
        public Builder homePhoneNumber(final java.lang.String homePhoneNumber) {
            this.config.homePhoneNumber(homePhoneNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#id CustomerprofilesProfile#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#id CustomerprofilesProfile#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#last_name CustomerprofilesProfile#last_name}.
         * <p>
         * @return {@code this}
         * @param lastName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#last_name CustomerprofilesProfile#last_name}. This parameter is required.
         */
        public Builder lastName(final java.lang.String lastName) {
            this.config.lastName(lastName);
            return this;
        }

        /**
         * mailing_address block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mailing_address CustomerprofilesProfile#mailing_address}
         * <p>
         * @return {@code this}
         * @param mailingAddress mailing_address block. This parameter is required.
         */
        public Builder mailingAddress(final imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress mailingAddress) {
            this.config.mailingAddress(mailingAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#middle_name CustomerprofilesProfile#middle_name}.
         * <p>
         * @return {@code this}
         * @param middleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#middle_name CustomerprofilesProfile#middle_name}. This parameter is required.
         */
        public Builder middleName(final java.lang.String middleName) {
            this.config.middleName(middleName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mobile_phone_number CustomerprofilesProfile#mobile_phone_number}.
         * <p>
         * @return {@code this}
         * @param mobilePhoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mobile_phone_number CustomerprofilesProfile#mobile_phone_number}. This parameter is required.
         */
        public Builder mobilePhoneNumber(final java.lang.String mobilePhoneNumber) {
            this.config.mobilePhoneNumber(mobilePhoneNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#party_type_string CustomerprofilesProfile#party_type_string}.
         * <p>
         * @return {@code this}
         * @param partyTypeString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#party_type_string CustomerprofilesProfile#party_type_string}. This parameter is required.
         */
        public Builder partyTypeString(final java.lang.String partyTypeString) {
            this.config.partyTypeString(partyTypeString);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#personal_email_address CustomerprofilesProfile#personal_email_address}.
         * <p>
         * @return {@code this}
         * @param personalEmailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#personal_email_address CustomerprofilesProfile#personal_email_address}. This parameter is required.
         */
        public Builder personalEmailAddress(final java.lang.String personalEmailAddress) {
            this.config.personalEmailAddress(personalEmailAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#phone_number CustomerprofilesProfile#phone_number}.
         * <p>
         * @return {@code this}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#phone_number CustomerprofilesProfile#phone_number}. This parameter is required.
         */
        public Builder phoneNumber(final java.lang.String phoneNumber) {
            this.config.phoneNumber(phoneNumber);
            return this;
        }

        /**
         * shipping_address block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#shipping_address CustomerprofilesProfile#shipping_address}
         * <p>
         * @return {@code this}
         * @param shippingAddress shipping_address block. This parameter is required.
         */
        public Builder shippingAddress(final imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress shippingAddress) {
            this.config.shippingAddress(shippingAddress);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.customerprofiles_profile.CustomerprofilesProfile}.
         */
        @Override
        public imports.aws.customerprofiles_profile.CustomerprofilesProfile build() {
            return new imports.aws.customerprofiles_profile.CustomerprofilesProfile(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
