package imports.aws.account_primary_contact;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact aws_account_primary_contact}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.888Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accountPrimaryContact.AccountPrimaryContact")
public class AccountPrimaryContact extends com.hashicorp.cdktf.TerraformResource {

    protected AccountPrimaryContact(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AccountPrimaryContact(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.account_primary_contact.AccountPrimaryContact.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact aws_account_primary_contact} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AccountPrimaryContact(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.account_primary_contact.AccountPrimaryContactConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AccountPrimaryContact resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AccountPrimaryContact to import. This parameter is required.
     * @param importFromId The id of the existing AccountPrimaryContact that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AccountPrimaryContact to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.account_primary_contact.AccountPrimaryContact.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AccountPrimaryContact resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AccountPrimaryContact to import. This parameter is required.
     * @param importFromId The id of the existing AccountPrimaryContact that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.account_primary_contact.AccountPrimaryContact.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAddressLine2() {
        software.amazon.jsii.Kernel.call(this, "resetAddressLine2", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAddressLine3() {
        software.amazon.jsii.Kernel.call(this, "resetAddressLine3", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCompanyName() {
        software.amazon.jsii.Kernel.call(this, "resetCompanyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDistrictOrCounty() {
        software.amazon.jsii.Kernel.call(this, "resetDistrictOrCounty", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStateOrRegion() {
        software.amazon.jsii.Kernel.call(this, "resetStateOrRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWebsiteUrl() {
        software.amazon.jsii.Kernel.call(this, "resetWebsiteUrl", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressLine1Input() {
        return software.amazon.jsii.Kernel.get(this, "addressLine1Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressLine2Input() {
        return software.amazon.jsii.Kernel.get(this, "addressLine2Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressLine3Input() {
        return software.amazon.jsii.Kernel.get(this, "addressLine3Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCityInput() {
        return software.amazon.jsii.Kernel.get(this, "cityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompanyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "companyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCountryCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "countryCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDistrictOrCountyInput() {
        return software.amazon.jsii.Kernel.get(this, "districtOrCountyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFullNameInput() {
        return software.amazon.jsii.Kernel.get(this, "fullNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPhoneNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPostalCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "postalCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStateOrRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "stateOrRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWebsiteUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "websiteUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAddressLine3() {
        return software.amazon.jsii.Kernel.get(this, "addressLine3", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAddressLine3(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "addressLine3", java.util.Objects.requireNonNull(value, "addressLine3 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCity() {
        return software.amazon.jsii.Kernel.get(this, "city", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "city", java.util.Objects.requireNonNull(value, "city is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompanyName() {
        return software.amazon.jsii.Kernel.get(this, "companyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompanyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "companyName", java.util.Objects.requireNonNull(value, "companyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCountryCode() {
        return software.amazon.jsii.Kernel.get(this, "countryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCountryCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "countryCode", java.util.Objects.requireNonNull(value, "countryCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDistrictOrCounty() {
        return software.amazon.jsii.Kernel.get(this, "districtOrCounty", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDistrictOrCounty(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "districtOrCounty", java.util.Objects.requireNonNull(value, "districtOrCounty is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFullName() {
        return software.amazon.jsii.Kernel.get(this, "fullName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFullName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fullName", java.util.Objects.requireNonNull(value, "fullName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPhoneNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "phoneNumber", java.util.Objects.requireNonNull(value, "phoneNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostalCode() {
        return software.amazon.jsii.Kernel.get(this, "postalCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPostalCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "postalCode", java.util.Objects.requireNonNull(value, "postalCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStateOrRegion() {
        return software.amazon.jsii.Kernel.get(this, "stateOrRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStateOrRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stateOrRegion", java.util.Objects.requireNonNull(value, "stateOrRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWebsiteUrl() {
        return software.amazon.jsii.Kernel.get(this, "websiteUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWebsiteUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "websiteUrl", java.util.Objects.requireNonNull(value, "websiteUrl is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.account_primary_contact.AccountPrimaryContact}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.account_primary_contact.AccountPrimaryContact> {
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
        private final imports.aws.account_primary_contact.AccountPrimaryContactConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.account_primary_contact.AccountPrimaryContactConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_1 AccountPrimaryContact#address_line_1}.
         * <p>
         * @return {@code this}
         * @param addressLine1 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_1 AccountPrimaryContact#address_line_1}. This parameter is required.
         */
        public Builder addressLine1(final java.lang.String addressLine1) {
            this.config.addressLine1(addressLine1);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#city AccountPrimaryContact#city}.
         * <p>
         * @return {@code this}
         * @param city Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#city AccountPrimaryContact#city}. This parameter is required.
         */
        public Builder city(final java.lang.String city) {
            this.config.city(city);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#country_code AccountPrimaryContact#country_code}.
         * <p>
         * @return {@code this}
         * @param countryCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#country_code AccountPrimaryContact#country_code}. This parameter is required.
         */
        public Builder countryCode(final java.lang.String countryCode) {
            this.config.countryCode(countryCode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#full_name AccountPrimaryContact#full_name}.
         * <p>
         * @return {@code this}
         * @param fullName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#full_name AccountPrimaryContact#full_name}. This parameter is required.
         */
        public Builder fullName(final java.lang.String fullName) {
            this.config.fullName(fullName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#phone_number AccountPrimaryContact#phone_number}.
         * <p>
         * @return {@code this}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#phone_number AccountPrimaryContact#phone_number}. This parameter is required.
         */
        public Builder phoneNumber(final java.lang.String phoneNumber) {
            this.config.phoneNumber(phoneNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#postal_code AccountPrimaryContact#postal_code}.
         * <p>
         * @return {@code this}
         * @param postalCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#postal_code AccountPrimaryContact#postal_code}. This parameter is required.
         */
        public Builder postalCode(final java.lang.String postalCode) {
            this.config.postalCode(postalCode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#account_id AccountPrimaryContact#account_id}.
         * <p>
         * @return {@code this}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#account_id AccountPrimaryContact#account_id}. This parameter is required.
         */
        public Builder accountId(final java.lang.String accountId) {
            this.config.accountId(accountId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_2 AccountPrimaryContact#address_line_2}.
         * <p>
         * @return {@code this}
         * @param addressLine2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_2 AccountPrimaryContact#address_line_2}. This parameter is required.
         */
        public Builder addressLine2(final java.lang.String addressLine2) {
            this.config.addressLine2(addressLine2);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_3 AccountPrimaryContact#address_line_3}.
         * <p>
         * @return {@code this}
         * @param addressLine3 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#address_line_3 AccountPrimaryContact#address_line_3}. This parameter is required.
         */
        public Builder addressLine3(final java.lang.String addressLine3) {
            this.config.addressLine3(addressLine3);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#company_name AccountPrimaryContact#company_name}.
         * <p>
         * @return {@code this}
         * @param companyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#company_name AccountPrimaryContact#company_name}. This parameter is required.
         */
        public Builder companyName(final java.lang.String companyName) {
            this.config.companyName(companyName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#district_or_county AccountPrimaryContact#district_or_county}.
         * <p>
         * @return {@code this}
         * @param districtOrCounty Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#district_or_county AccountPrimaryContact#district_or_county}. This parameter is required.
         */
        public Builder districtOrCounty(final java.lang.String districtOrCounty) {
            this.config.districtOrCounty(districtOrCounty);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#id AccountPrimaryContact#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#id AccountPrimaryContact#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#state_or_region AccountPrimaryContact#state_or_region}.
         * <p>
         * @return {@code this}
         * @param stateOrRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#state_or_region AccountPrimaryContact#state_or_region}. This parameter is required.
         */
        public Builder stateOrRegion(final java.lang.String stateOrRegion) {
            this.config.stateOrRegion(stateOrRegion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#website_url AccountPrimaryContact#website_url}.
         * <p>
         * @return {@code this}
         * @param websiteUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_primary_contact#website_url AccountPrimaryContact#website_url}. This parameter is required.
         */
        public Builder websiteUrl(final java.lang.String websiteUrl) {
            this.config.websiteUrl(websiteUrl);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.account_primary_contact.AccountPrimaryContact}.
         */
        @Override
        public imports.aws.account_primary_contact.AccountPrimaryContact build() {
            return new imports.aws.account_primary_contact.AccountPrimaryContact(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
