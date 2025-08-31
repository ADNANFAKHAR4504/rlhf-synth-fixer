package imports.aws.customerprofiles_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.404Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesProfile.CustomerprofilesProfileConfig")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesProfileConfig.Jsii$Proxy.class)
public interface CustomerprofilesProfileConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#domain_name CustomerprofilesProfile#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#account_number CustomerprofilesProfile#account_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#additional_information CustomerprofilesProfile#additional_information}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdditionalInformation() {
        return null;
    }

    /**
     * address block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address CustomerprofilesProfile#address}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress getAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#attributes CustomerprofilesProfile#attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAttributes() {
        return null;
    }

    /**
     * billing_address block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#billing_address CustomerprofilesProfile#billing_address}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress getBillingAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#birth_date CustomerprofilesProfile#birth_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBirthDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_email_address CustomerprofilesProfile#business_email_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBusinessEmailAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_name CustomerprofilesProfile#business_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBusinessName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_phone_number CustomerprofilesProfile#business_phone_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBusinessPhoneNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#email_address CustomerprofilesProfile#email_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmailAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#first_name CustomerprofilesProfile#first_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFirstName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#gender_string CustomerprofilesProfile#gender_string}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGenderString() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#home_phone_number CustomerprofilesProfile#home_phone_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHomePhoneNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#id CustomerprofilesProfile#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#last_name CustomerprofilesProfile#last_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLastName() {
        return null;
    }

    /**
     * mailing_address block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mailing_address CustomerprofilesProfile#mailing_address}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress getMailingAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#middle_name CustomerprofilesProfile#middle_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMiddleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mobile_phone_number CustomerprofilesProfile#mobile_phone_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMobilePhoneNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#party_type_string CustomerprofilesProfile#party_type_string}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPartyTypeString() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#personal_email_address CustomerprofilesProfile#personal_email_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPersonalEmailAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#phone_number CustomerprofilesProfile#phone_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPhoneNumber() {
        return null;
    }

    /**
     * shipping_address block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#shipping_address CustomerprofilesProfile#shipping_address}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress getShippingAddress() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesProfileConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesProfileConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesProfileConfig> {
        java.lang.String domainName;
        java.lang.String accountNumber;
        java.lang.String additionalInformation;
        imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress address;
        java.util.Map<java.lang.String, java.lang.String> attributes;
        imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress billingAddress;
        java.lang.String birthDate;
        java.lang.String businessEmailAddress;
        java.lang.String businessName;
        java.lang.String businessPhoneNumber;
        java.lang.String emailAddress;
        java.lang.String firstName;
        java.lang.String genderString;
        java.lang.String homePhoneNumber;
        java.lang.String id;
        java.lang.String lastName;
        imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress mailingAddress;
        java.lang.String middleName;
        java.lang.String mobilePhoneNumber;
        java.lang.String partyTypeString;
        java.lang.String personalEmailAddress;
        java.lang.String phoneNumber;
        imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress shippingAddress;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#domain_name CustomerprofilesProfile#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getAccountNumber}
         * @param accountNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#account_number CustomerprofilesProfile#account_number}.
         * @return {@code this}
         */
        public Builder accountNumber(java.lang.String accountNumber) {
            this.accountNumber = accountNumber;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getAdditionalInformation}
         * @param additionalInformation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#additional_information CustomerprofilesProfile#additional_information}.
         * @return {@code this}
         */
        public Builder additionalInformation(java.lang.String additionalInformation) {
            this.additionalInformation = additionalInformation;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getAddress}
         * @param address address block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address CustomerprofilesProfile#address}
         * @return {@code this}
         */
        public Builder address(imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress address) {
            this.address = address;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getAttributes}
         * @param attributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#attributes CustomerprofilesProfile#attributes}.
         * @return {@code this}
         */
        public Builder attributes(java.util.Map<java.lang.String, java.lang.String> attributes) {
            this.attributes = attributes;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getBillingAddress}
         * @param billingAddress billing_address block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#billing_address CustomerprofilesProfile#billing_address}
         * @return {@code this}
         */
        public Builder billingAddress(imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress billingAddress) {
            this.billingAddress = billingAddress;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getBirthDate}
         * @param birthDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#birth_date CustomerprofilesProfile#birth_date}.
         * @return {@code this}
         */
        public Builder birthDate(java.lang.String birthDate) {
            this.birthDate = birthDate;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getBusinessEmailAddress}
         * @param businessEmailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_email_address CustomerprofilesProfile#business_email_address}.
         * @return {@code this}
         */
        public Builder businessEmailAddress(java.lang.String businessEmailAddress) {
            this.businessEmailAddress = businessEmailAddress;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getBusinessName}
         * @param businessName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_name CustomerprofilesProfile#business_name}.
         * @return {@code this}
         */
        public Builder businessName(java.lang.String businessName) {
            this.businessName = businessName;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getBusinessPhoneNumber}
         * @param businessPhoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#business_phone_number CustomerprofilesProfile#business_phone_number}.
         * @return {@code this}
         */
        public Builder businessPhoneNumber(java.lang.String businessPhoneNumber) {
            this.businessPhoneNumber = businessPhoneNumber;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getEmailAddress}
         * @param emailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#email_address CustomerprofilesProfile#email_address}.
         * @return {@code this}
         */
        public Builder emailAddress(java.lang.String emailAddress) {
            this.emailAddress = emailAddress;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getFirstName}
         * @param firstName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#first_name CustomerprofilesProfile#first_name}.
         * @return {@code this}
         */
        public Builder firstName(java.lang.String firstName) {
            this.firstName = firstName;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getGenderString}
         * @param genderString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#gender_string CustomerprofilesProfile#gender_string}.
         * @return {@code this}
         */
        public Builder genderString(java.lang.String genderString) {
            this.genderString = genderString;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getHomePhoneNumber}
         * @param homePhoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#home_phone_number CustomerprofilesProfile#home_phone_number}.
         * @return {@code this}
         */
        public Builder homePhoneNumber(java.lang.String homePhoneNumber) {
            this.homePhoneNumber = homePhoneNumber;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#id CustomerprofilesProfile#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getLastName}
         * @param lastName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#last_name CustomerprofilesProfile#last_name}.
         * @return {@code this}
         */
        public Builder lastName(java.lang.String lastName) {
            this.lastName = lastName;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getMailingAddress}
         * @param mailingAddress mailing_address block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mailing_address CustomerprofilesProfile#mailing_address}
         * @return {@code this}
         */
        public Builder mailingAddress(imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress mailingAddress) {
            this.mailingAddress = mailingAddress;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getMiddleName}
         * @param middleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#middle_name CustomerprofilesProfile#middle_name}.
         * @return {@code this}
         */
        public Builder middleName(java.lang.String middleName) {
            this.middleName = middleName;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getMobilePhoneNumber}
         * @param mobilePhoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#mobile_phone_number CustomerprofilesProfile#mobile_phone_number}.
         * @return {@code this}
         */
        public Builder mobilePhoneNumber(java.lang.String mobilePhoneNumber) {
            this.mobilePhoneNumber = mobilePhoneNumber;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getPartyTypeString}
         * @param partyTypeString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#party_type_string CustomerprofilesProfile#party_type_string}.
         * @return {@code this}
         */
        public Builder partyTypeString(java.lang.String partyTypeString) {
            this.partyTypeString = partyTypeString;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getPersonalEmailAddress}
         * @param personalEmailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#personal_email_address CustomerprofilesProfile#personal_email_address}.
         * @return {@code this}
         */
        public Builder personalEmailAddress(java.lang.String personalEmailAddress) {
            this.personalEmailAddress = personalEmailAddress;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getPhoneNumber}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#phone_number CustomerprofilesProfile#phone_number}.
         * @return {@code this}
         */
        public Builder phoneNumber(java.lang.String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getShippingAddress}
         * @param shippingAddress shipping_address block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#shipping_address CustomerprofilesProfile#shipping_address}
         * @return {@code this}
         */
        public Builder shippingAddress(imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress shippingAddress) {
            this.shippingAddress = shippingAddress;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesProfileConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesProfileConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesProfileConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesProfileConfig {
        private final java.lang.String domainName;
        private final java.lang.String accountNumber;
        private final java.lang.String additionalInformation;
        private final imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress address;
        private final java.util.Map<java.lang.String, java.lang.String> attributes;
        private final imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress billingAddress;
        private final java.lang.String birthDate;
        private final java.lang.String businessEmailAddress;
        private final java.lang.String businessName;
        private final java.lang.String businessPhoneNumber;
        private final java.lang.String emailAddress;
        private final java.lang.String firstName;
        private final java.lang.String genderString;
        private final java.lang.String homePhoneNumber;
        private final java.lang.String id;
        private final java.lang.String lastName;
        private final imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress mailingAddress;
        private final java.lang.String middleName;
        private final java.lang.String mobilePhoneNumber;
        private final java.lang.String partyTypeString;
        private final java.lang.String personalEmailAddress;
        private final java.lang.String phoneNumber;
        private final imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress shippingAddress;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountNumber = software.amazon.jsii.Kernel.get(this, "accountNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalInformation = software.amazon.jsii.Kernel.get(this, "additionalInformation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.address = software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress.class));
            this.attributes = software.amazon.jsii.Kernel.get(this, "attributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.billingAddress = software.amazon.jsii.Kernel.get(this, "billingAddress", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress.class));
            this.birthDate = software.amazon.jsii.Kernel.get(this, "birthDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.businessEmailAddress = software.amazon.jsii.Kernel.get(this, "businessEmailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.businessName = software.amazon.jsii.Kernel.get(this, "businessName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.businessPhoneNumber = software.amazon.jsii.Kernel.get(this, "businessPhoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.emailAddress = software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.firstName = software.amazon.jsii.Kernel.get(this, "firstName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.genderString = software.amazon.jsii.Kernel.get(this, "genderString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.homePhoneNumber = software.amazon.jsii.Kernel.get(this, "homePhoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lastName = software.amazon.jsii.Kernel.get(this, "lastName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mailingAddress = software.amazon.jsii.Kernel.get(this, "mailingAddress", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress.class));
            this.middleName = software.amazon.jsii.Kernel.get(this, "middleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mobilePhoneNumber = software.amazon.jsii.Kernel.get(this, "mobilePhoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.partyTypeString = software.amazon.jsii.Kernel.get(this, "partyTypeString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.personalEmailAddress = software.amazon.jsii.Kernel.get(this, "personalEmailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.phoneNumber = software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.shippingAddress = software.amazon.jsii.Kernel.get(this, "shippingAddress", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.accountNumber = builder.accountNumber;
            this.additionalInformation = builder.additionalInformation;
            this.address = builder.address;
            this.attributes = builder.attributes;
            this.billingAddress = builder.billingAddress;
            this.birthDate = builder.birthDate;
            this.businessEmailAddress = builder.businessEmailAddress;
            this.businessName = builder.businessName;
            this.businessPhoneNumber = builder.businessPhoneNumber;
            this.emailAddress = builder.emailAddress;
            this.firstName = builder.firstName;
            this.genderString = builder.genderString;
            this.homePhoneNumber = builder.homePhoneNumber;
            this.id = builder.id;
            this.lastName = builder.lastName;
            this.mailingAddress = builder.mailingAddress;
            this.middleName = builder.middleName;
            this.mobilePhoneNumber = builder.mobilePhoneNumber;
            this.partyTypeString = builder.partyTypeString;
            this.personalEmailAddress = builder.personalEmailAddress;
            this.phoneNumber = builder.phoneNumber;
            this.shippingAddress = builder.shippingAddress;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getAccountNumber() {
            return this.accountNumber;
        }

        @Override
        public final java.lang.String getAdditionalInformation() {
            return this.additionalInformation;
        }

        @Override
        public final imports.aws.customerprofiles_profile.CustomerprofilesProfileAddress getAddress() {
            return this.address;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAttributes() {
            return this.attributes;
        }

        @Override
        public final imports.aws.customerprofiles_profile.CustomerprofilesProfileBillingAddress getBillingAddress() {
            return this.billingAddress;
        }

        @Override
        public final java.lang.String getBirthDate() {
            return this.birthDate;
        }

        @Override
        public final java.lang.String getBusinessEmailAddress() {
            return this.businessEmailAddress;
        }

        @Override
        public final java.lang.String getBusinessName() {
            return this.businessName;
        }

        @Override
        public final java.lang.String getBusinessPhoneNumber() {
            return this.businessPhoneNumber;
        }

        @Override
        public final java.lang.String getEmailAddress() {
            return this.emailAddress;
        }

        @Override
        public final java.lang.String getFirstName() {
            return this.firstName;
        }

        @Override
        public final java.lang.String getGenderString() {
            return this.genderString;
        }

        @Override
        public final java.lang.String getHomePhoneNumber() {
            return this.homePhoneNumber;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLastName() {
            return this.lastName;
        }

        @Override
        public final imports.aws.customerprofiles_profile.CustomerprofilesProfileMailingAddress getMailingAddress() {
            return this.mailingAddress;
        }

        @Override
        public final java.lang.String getMiddleName() {
            return this.middleName;
        }

        @Override
        public final java.lang.String getMobilePhoneNumber() {
            return this.mobilePhoneNumber;
        }

        @Override
        public final java.lang.String getPartyTypeString() {
            return this.partyTypeString;
        }

        @Override
        public final java.lang.String getPersonalEmailAddress() {
            return this.personalEmailAddress;
        }

        @Override
        public final java.lang.String getPhoneNumber() {
            return this.phoneNumber;
        }

        @Override
        public final imports.aws.customerprofiles_profile.CustomerprofilesProfileShippingAddress getShippingAddress() {
            return this.shippingAddress;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domainName", om.valueToTree(this.getDomainName()));
            if (this.getAccountNumber() != null) {
                data.set("accountNumber", om.valueToTree(this.getAccountNumber()));
            }
            if (this.getAdditionalInformation() != null) {
                data.set("additionalInformation", om.valueToTree(this.getAdditionalInformation()));
            }
            if (this.getAddress() != null) {
                data.set("address", om.valueToTree(this.getAddress()));
            }
            if (this.getAttributes() != null) {
                data.set("attributes", om.valueToTree(this.getAttributes()));
            }
            if (this.getBillingAddress() != null) {
                data.set("billingAddress", om.valueToTree(this.getBillingAddress()));
            }
            if (this.getBirthDate() != null) {
                data.set("birthDate", om.valueToTree(this.getBirthDate()));
            }
            if (this.getBusinessEmailAddress() != null) {
                data.set("businessEmailAddress", om.valueToTree(this.getBusinessEmailAddress()));
            }
            if (this.getBusinessName() != null) {
                data.set("businessName", om.valueToTree(this.getBusinessName()));
            }
            if (this.getBusinessPhoneNumber() != null) {
                data.set("businessPhoneNumber", om.valueToTree(this.getBusinessPhoneNumber()));
            }
            if (this.getEmailAddress() != null) {
                data.set("emailAddress", om.valueToTree(this.getEmailAddress()));
            }
            if (this.getFirstName() != null) {
                data.set("firstName", om.valueToTree(this.getFirstName()));
            }
            if (this.getGenderString() != null) {
                data.set("genderString", om.valueToTree(this.getGenderString()));
            }
            if (this.getHomePhoneNumber() != null) {
                data.set("homePhoneNumber", om.valueToTree(this.getHomePhoneNumber()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLastName() != null) {
                data.set("lastName", om.valueToTree(this.getLastName()));
            }
            if (this.getMailingAddress() != null) {
                data.set("mailingAddress", om.valueToTree(this.getMailingAddress()));
            }
            if (this.getMiddleName() != null) {
                data.set("middleName", om.valueToTree(this.getMiddleName()));
            }
            if (this.getMobilePhoneNumber() != null) {
                data.set("mobilePhoneNumber", om.valueToTree(this.getMobilePhoneNumber()));
            }
            if (this.getPartyTypeString() != null) {
                data.set("partyTypeString", om.valueToTree(this.getPartyTypeString()));
            }
            if (this.getPersonalEmailAddress() != null) {
                data.set("personalEmailAddress", om.valueToTree(this.getPersonalEmailAddress()));
            }
            if (this.getPhoneNumber() != null) {
                data.set("phoneNumber", om.valueToTree(this.getPhoneNumber()));
            }
            if (this.getShippingAddress() != null) {
                data.set("shippingAddress", om.valueToTree(this.getShippingAddress()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesProfile.CustomerprofilesProfileConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesProfileConfig.Jsii$Proxy that = (CustomerprofilesProfileConfig.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            if (this.accountNumber != null ? !this.accountNumber.equals(that.accountNumber) : that.accountNumber != null) return false;
            if (this.additionalInformation != null ? !this.additionalInformation.equals(that.additionalInformation) : that.additionalInformation != null) return false;
            if (this.address != null ? !this.address.equals(that.address) : that.address != null) return false;
            if (this.attributes != null ? !this.attributes.equals(that.attributes) : that.attributes != null) return false;
            if (this.billingAddress != null ? !this.billingAddress.equals(that.billingAddress) : that.billingAddress != null) return false;
            if (this.birthDate != null ? !this.birthDate.equals(that.birthDate) : that.birthDate != null) return false;
            if (this.businessEmailAddress != null ? !this.businessEmailAddress.equals(that.businessEmailAddress) : that.businessEmailAddress != null) return false;
            if (this.businessName != null ? !this.businessName.equals(that.businessName) : that.businessName != null) return false;
            if (this.businessPhoneNumber != null ? !this.businessPhoneNumber.equals(that.businessPhoneNumber) : that.businessPhoneNumber != null) return false;
            if (this.emailAddress != null ? !this.emailAddress.equals(that.emailAddress) : that.emailAddress != null) return false;
            if (this.firstName != null ? !this.firstName.equals(that.firstName) : that.firstName != null) return false;
            if (this.genderString != null ? !this.genderString.equals(that.genderString) : that.genderString != null) return false;
            if (this.homePhoneNumber != null ? !this.homePhoneNumber.equals(that.homePhoneNumber) : that.homePhoneNumber != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lastName != null ? !this.lastName.equals(that.lastName) : that.lastName != null) return false;
            if (this.mailingAddress != null ? !this.mailingAddress.equals(that.mailingAddress) : that.mailingAddress != null) return false;
            if (this.middleName != null ? !this.middleName.equals(that.middleName) : that.middleName != null) return false;
            if (this.mobilePhoneNumber != null ? !this.mobilePhoneNumber.equals(that.mobilePhoneNumber) : that.mobilePhoneNumber != null) return false;
            if (this.partyTypeString != null ? !this.partyTypeString.equals(that.partyTypeString) : that.partyTypeString != null) return false;
            if (this.personalEmailAddress != null ? !this.personalEmailAddress.equals(that.personalEmailAddress) : that.personalEmailAddress != null) return false;
            if (this.phoneNumber != null ? !this.phoneNumber.equals(that.phoneNumber) : that.phoneNumber != null) return false;
            if (this.shippingAddress != null ? !this.shippingAddress.equals(that.shippingAddress) : that.shippingAddress != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domainName.hashCode();
            result = 31 * result + (this.accountNumber != null ? this.accountNumber.hashCode() : 0);
            result = 31 * result + (this.additionalInformation != null ? this.additionalInformation.hashCode() : 0);
            result = 31 * result + (this.address != null ? this.address.hashCode() : 0);
            result = 31 * result + (this.attributes != null ? this.attributes.hashCode() : 0);
            result = 31 * result + (this.billingAddress != null ? this.billingAddress.hashCode() : 0);
            result = 31 * result + (this.birthDate != null ? this.birthDate.hashCode() : 0);
            result = 31 * result + (this.businessEmailAddress != null ? this.businessEmailAddress.hashCode() : 0);
            result = 31 * result + (this.businessName != null ? this.businessName.hashCode() : 0);
            result = 31 * result + (this.businessPhoneNumber != null ? this.businessPhoneNumber.hashCode() : 0);
            result = 31 * result + (this.emailAddress != null ? this.emailAddress.hashCode() : 0);
            result = 31 * result + (this.firstName != null ? this.firstName.hashCode() : 0);
            result = 31 * result + (this.genderString != null ? this.genderString.hashCode() : 0);
            result = 31 * result + (this.homePhoneNumber != null ? this.homePhoneNumber.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lastName != null ? this.lastName.hashCode() : 0);
            result = 31 * result + (this.mailingAddress != null ? this.mailingAddress.hashCode() : 0);
            result = 31 * result + (this.middleName != null ? this.middleName.hashCode() : 0);
            result = 31 * result + (this.mobilePhoneNumber != null ? this.mobilePhoneNumber.hashCode() : 0);
            result = 31 * result + (this.partyTypeString != null ? this.partyTypeString.hashCode() : 0);
            result = 31 * result + (this.personalEmailAddress != null ? this.personalEmailAddress.hashCode() : 0);
            result = 31 * result + (this.phoneNumber != null ? this.phoneNumber.hashCode() : 0);
            result = 31 * result + (this.shippingAddress != null ? this.shippingAddress.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
