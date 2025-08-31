package imports.aws.account_primary_contact;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accountPrimaryContact.AccountPrimaryContactConfig")
@software.amazon.jsii.Jsii.Proxy(AccountPrimaryContactConfig.Jsii$Proxy.class)
public interface AccountPrimaryContactConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_1 AccountPrimaryContact#address_line_1}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAddressLine1();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#city AccountPrimaryContact#city}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#country_code AccountPrimaryContact#country_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCountryCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#full_name AccountPrimaryContact#full_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFullName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#phone_number AccountPrimaryContact#phone_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPhoneNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#postal_code AccountPrimaryContact#postal_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPostalCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#account_id AccountPrimaryContact#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_2 AccountPrimaryContact#address_line_2}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddressLine2() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_3 AccountPrimaryContact#address_line_3}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddressLine3() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#company_name AccountPrimaryContact#company_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCompanyName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#district_or_county AccountPrimaryContact#district_or_county}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDistrictOrCounty() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#id AccountPrimaryContact#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#state_or_region AccountPrimaryContact#state_or_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStateOrRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#website_url AccountPrimaryContact#website_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWebsiteUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AccountPrimaryContactConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AccountPrimaryContactConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AccountPrimaryContactConfig> {
        java.lang.String addressLine1;
        java.lang.String city;
        java.lang.String countryCode;
        java.lang.String fullName;
        java.lang.String phoneNumber;
        java.lang.String postalCode;
        java.lang.String accountId;
        java.lang.String addressLine2;
        java.lang.String addressLine3;
        java.lang.String companyName;
        java.lang.String districtOrCounty;
        java.lang.String id;
        java.lang.String stateOrRegion;
        java.lang.String websiteUrl;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getAddressLine1}
         * @param addressLine1 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_1 AccountPrimaryContact#address_line_1}. This parameter is required.
         * @return {@code this}
         */
        public Builder addressLine1(java.lang.String addressLine1) {
            this.addressLine1 = addressLine1;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getCity}
         * @param city Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#city AccountPrimaryContact#city}. This parameter is required.
         * @return {@code this}
         */
        public Builder city(java.lang.String city) {
            this.city = city;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getCountryCode}
         * @param countryCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#country_code AccountPrimaryContact#country_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder countryCode(java.lang.String countryCode) {
            this.countryCode = countryCode;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getFullName}
         * @param fullName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#full_name AccountPrimaryContact#full_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder fullName(java.lang.String fullName) {
            this.fullName = fullName;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getPhoneNumber}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#phone_number AccountPrimaryContact#phone_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder phoneNumber(java.lang.String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getPostalCode}
         * @param postalCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#postal_code AccountPrimaryContact#postal_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder postalCode(java.lang.String postalCode) {
            this.postalCode = postalCode;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#account_id AccountPrimaryContact#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getAddressLine2}
         * @param addressLine2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_2 AccountPrimaryContact#address_line_2}.
         * @return {@code this}
         */
        public Builder addressLine2(java.lang.String addressLine2) {
            this.addressLine2 = addressLine2;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getAddressLine3}
         * @param addressLine3 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_3 AccountPrimaryContact#address_line_3}.
         * @return {@code this}
         */
        public Builder addressLine3(java.lang.String addressLine3) {
            this.addressLine3 = addressLine3;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getCompanyName}
         * @param companyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#company_name AccountPrimaryContact#company_name}.
         * @return {@code this}
         */
        public Builder companyName(java.lang.String companyName) {
            this.companyName = companyName;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getDistrictOrCounty}
         * @param districtOrCounty Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#district_or_county AccountPrimaryContact#district_or_county}.
         * @return {@code this}
         */
        public Builder districtOrCounty(java.lang.String districtOrCounty) {
            this.districtOrCounty = districtOrCounty;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#id AccountPrimaryContact#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getStateOrRegion}
         * @param stateOrRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#state_or_region AccountPrimaryContact#state_or_region}.
         * @return {@code this}
         */
        public Builder stateOrRegion(java.lang.String stateOrRegion) {
            this.stateOrRegion = stateOrRegion;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getWebsiteUrl}
         * @param websiteUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#website_url AccountPrimaryContact#website_url}.
         * @return {@code this}
         */
        public Builder websiteUrl(java.lang.String websiteUrl) {
            this.websiteUrl = websiteUrl;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getDependsOn}
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
         * Sets the value of {@link AccountPrimaryContactConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AccountPrimaryContactConfig#getProvisioners}
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
         * @return a new instance of {@link AccountPrimaryContactConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AccountPrimaryContactConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AccountPrimaryContactConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AccountPrimaryContactConfig {
        private final java.lang.String addressLine1;
        private final java.lang.String city;
        private final java.lang.String countryCode;
        private final java.lang.String fullName;
        private final java.lang.String phoneNumber;
        private final java.lang.String postalCode;
        private final java.lang.String accountId;
        private final java.lang.String addressLine2;
        private final java.lang.String addressLine3;
        private final java.lang.String companyName;
        private final java.lang.String districtOrCounty;
        private final java.lang.String id;
        private final java.lang.String stateOrRegion;
        private final java.lang.String websiteUrl;
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
            this.addressLine1 = software.amazon.jsii.Kernel.get(this, "addressLine1", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.city = software.amazon.jsii.Kernel.get(this, "city", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.countryCode = software.amazon.jsii.Kernel.get(this, "countryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fullName = software.amazon.jsii.Kernel.get(this, "fullName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.phoneNumber = software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.postalCode = software.amazon.jsii.Kernel.get(this, "postalCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.addressLine2 = software.amazon.jsii.Kernel.get(this, "addressLine2", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.addressLine3 = software.amazon.jsii.Kernel.get(this, "addressLine3", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.companyName = software.amazon.jsii.Kernel.get(this, "companyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.districtOrCounty = software.amazon.jsii.Kernel.get(this, "districtOrCounty", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stateOrRegion = software.amazon.jsii.Kernel.get(this, "stateOrRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.websiteUrl = software.amazon.jsii.Kernel.get(this, "websiteUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.addressLine1 = java.util.Objects.requireNonNull(builder.addressLine1, "addressLine1 is required");
            this.city = java.util.Objects.requireNonNull(builder.city, "city is required");
            this.countryCode = java.util.Objects.requireNonNull(builder.countryCode, "countryCode is required");
            this.fullName = java.util.Objects.requireNonNull(builder.fullName, "fullName is required");
            this.phoneNumber = java.util.Objects.requireNonNull(builder.phoneNumber, "phoneNumber is required");
            this.postalCode = java.util.Objects.requireNonNull(builder.postalCode, "postalCode is required");
            this.accountId = builder.accountId;
            this.addressLine2 = builder.addressLine2;
            this.addressLine3 = builder.addressLine3;
            this.companyName = builder.companyName;
            this.districtOrCounty = builder.districtOrCounty;
            this.id = builder.id;
            this.stateOrRegion = builder.stateOrRegion;
            this.websiteUrl = builder.websiteUrl;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAddressLine1() {
            return this.addressLine1;
        }

        @Override
        public final java.lang.String getCity() {
            return this.city;
        }

        @Override
        public final java.lang.String getCountryCode() {
            return this.countryCode;
        }

        @Override
        public final java.lang.String getFullName() {
            return this.fullName;
        }

        @Override
        public final java.lang.String getPhoneNumber() {
            return this.phoneNumber;
        }

        @Override
        public final java.lang.String getPostalCode() {
            return this.postalCode;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.String getAddressLine2() {
            return this.addressLine2;
        }

        @Override
        public final java.lang.String getAddressLine3() {
            return this.addressLine3;
        }

        @Override
        public final java.lang.String getCompanyName() {
            return this.companyName;
        }

        @Override
        public final java.lang.String getDistrictOrCounty() {
            return this.districtOrCounty;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getStateOrRegion() {
            return this.stateOrRegion;
        }

        @Override
        public final java.lang.String getWebsiteUrl() {
            return this.websiteUrl;
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

            data.set("addressLine1", om.valueToTree(this.getAddressLine1()));
            data.set("city", om.valueToTree(this.getCity()));
            data.set("countryCode", om.valueToTree(this.getCountryCode()));
            data.set("fullName", om.valueToTree(this.getFullName()));
            data.set("phoneNumber", om.valueToTree(this.getPhoneNumber()));
            data.set("postalCode", om.valueToTree(this.getPostalCode()));
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getAddressLine2() != null) {
                data.set("addressLine2", om.valueToTree(this.getAddressLine2()));
            }
            if (this.getAddressLine3() != null) {
                data.set("addressLine3", om.valueToTree(this.getAddressLine3()));
            }
            if (this.getCompanyName() != null) {
                data.set("companyName", om.valueToTree(this.getCompanyName()));
            }
            if (this.getDistrictOrCounty() != null) {
                data.set("districtOrCounty", om.valueToTree(this.getDistrictOrCounty()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getStateOrRegion() != null) {
                data.set("stateOrRegion", om.valueToTree(this.getStateOrRegion()));
            }
            if (this.getWebsiteUrl() != null) {
                data.set("websiteUrl", om.valueToTree(this.getWebsiteUrl()));
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
            struct.set("fqn", om.valueToTree("aws.accountPrimaryContact.AccountPrimaryContactConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AccountPrimaryContactConfig.Jsii$Proxy that = (AccountPrimaryContactConfig.Jsii$Proxy) o;

            if (!addressLine1.equals(that.addressLine1)) return false;
            if (!city.equals(that.city)) return false;
            if (!countryCode.equals(that.countryCode)) return false;
            if (!fullName.equals(that.fullName)) return false;
            if (!phoneNumber.equals(that.phoneNumber)) return false;
            if (!postalCode.equals(that.postalCode)) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.addressLine2 != null ? !this.addressLine2.equals(that.addressLine2) : that.addressLine2 != null) return false;
            if (this.addressLine3 != null ? !this.addressLine3.equals(that.addressLine3) : that.addressLine3 != null) return false;
            if (this.companyName != null ? !this.companyName.equals(that.companyName) : that.companyName != null) return false;
            if (this.districtOrCounty != null ? !this.districtOrCounty.equals(that.districtOrCounty) : that.districtOrCounty != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.stateOrRegion != null ? !this.stateOrRegion.equals(that.stateOrRegion) : that.stateOrRegion != null) return false;
            if (this.websiteUrl != null ? !this.websiteUrl.equals(that.websiteUrl) : that.websiteUrl != null) return false;
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
            int result = this.addressLine1.hashCode();
            result = 31 * result + (this.city.hashCode());
            result = 31 * result + (this.countryCode.hashCode());
            result = 31 * result + (this.fullName.hashCode());
            result = 31 * result + (this.phoneNumber.hashCode());
            result = 31 * result + (this.postalCode.hashCode());
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.addressLine2 != null ? this.addressLine2.hashCode() : 0);
            result = 31 * result + (this.addressLine3 != null ? this.addressLine3.hashCode() : 0);
            result = 31 * result + (this.companyName != null ? this.companyName.hashCode() : 0);
            result = 31 * result + (this.districtOrCounty != null ? this.districtOrCounty.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.stateOrRegion != null ? this.stateOrRegion.hashCode() : 0);
            result = 31 * result + (this.websiteUrl != null ? this.websiteUrl.hashCode() : 0);
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
