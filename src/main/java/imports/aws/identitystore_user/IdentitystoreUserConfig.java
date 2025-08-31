package imports.aws.identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.identitystoreUser.IdentitystoreUserConfig")
@software.amazon.jsii.Jsii.Proxy(IdentitystoreUserConfig.Jsii$Proxy.class)
public interface IdentitystoreUserConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#display_name IdentitystoreUser#display_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDisplayName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#identity_store_id IdentitystoreUser#identity_store_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentityStoreId();

    /**
     * name block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#name IdentitystoreUser#name}
     */
    @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserName getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#user_name IdentitystoreUser#user_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserName();

    /**
     * addresses block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#addresses IdentitystoreUser#addresses}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserAddresses getAddresses() {
        return null;
    }

    /**
     * emails block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#emails IdentitystoreUser#emails}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserEmails getEmails() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#id IdentitystoreUser#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#locale IdentitystoreUser#locale}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocale() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#nickname IdentitystoreUser#nickname}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNickname() {
        return null;
    }

    /**
     * phone_numbers block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#phone_numbers IdentitystoreUser#phone_numbers}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers getPhoneNumbers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#preferred_language IdentitystoreUser#preferred_language}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredLanguage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#profile_url IdentitystoreUser#profile_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProfileUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#timezone IdentitystoreUser#timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimezone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#title IdentitystoreUser#title}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTitle() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#user_type IdentitystoreUser#user_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IdentitystoreUserConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IdentitystoreUserConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IdentitystoreUserConfig> {
        java.lang.String displayName;
        java.lang.String identityStoreId;
        imports.aws.identitystore_user.IdentitystoreUserName name;
        java.lang.String userName;
        imports.aws.identitystore_user.IdentitystoreUserAddresses addresses;
        imports.aws.identitystore_user.IdentitystoreUserEmails emails;
        java.lang.String id;
        java.lang.String locale;
        java.lang.String nickname;
        imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers phoneNumbers;
        java.lang.String preferredLanguage;
        java.lang.String profileUrl;
        java.lang.String timezone;
        java.lang.String title;
        java.lang.String userType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#display_name IdentitystoreUser#display_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getIdentityStoreId}
         * @param identityStoreId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#identity_store_id IdentitystoreUser#identity_store_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder identityStoreId(java.lang.String identityStoreId) {
            this.identityStoreId = identityStoreId;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getName}
         * @param name name block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#name IdentitystoreUser#name}
         * @return {@code this}
         */
        public Builder name(imports.aws.identitystore_user.IdentitystoreUserName name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getUserName}
         * @param userName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#user_name IdentitystoreUser#user_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder userName(java.lang.String userName) {
            this.userName = userName;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getAddresses}
         * @param addresses addresses block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#addresses IdentitystoreUser#addresses}
         * @return {@code this}
         */
        public Builder addresses(imports.aws.identitystore_user.IdentitystoreUserAddresses addresses) {
            this.addresses = addresses;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getEmails}
         * @param emails emails block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#emails IdentitystoreUser#emails}
         * @return {@code this}
         */
        public Builder emails(imports.aws.identitystore_user.IdentitystoreUserEmails emails) {
            this.emails = emails;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#id IdentitystoreUser#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getLocale}
         * @param locale Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#locale IdentitystoreUser#locale}.
         * @return {@code this}
         */
        public Builder locale(java.lang.String locale) {
            this.locale = locale;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getNickname}
         * @param nickname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#nickname IdentitystoreUser#nickname}.
         * @return {@code this}
         */
        public Builder nickname(java.lang.String nickname) {
            this.nickname = nickname;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getPhoneNumbers}
         * @param phoneNumbers phone_numbers block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#phone_numbers IdentitystoreUser#phone_numbers}
         * @return {@code this}
         */
        public Builder phoneNumbers(imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers phoneNumbers) {
            this.phoneNumbers = phoneNumbers;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getPreferredLanguage}
         * @param preferredLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#preferred_language IdentitystoreUser#preferred_language}.
         * @return {@code this}
         */
        public Builder preferredLanguage(java.lang.String preferredLanguage) {
            this.preferredLanguage = preferredLanguage;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getProfileUrl}
         * @param profileUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#profile_url IdentitystoreUser#profile_url}.
         * @return {@code this}
         */
        public Builder profileUrl(java.lang.String profileUrl) {
            this.profileUrl = profileUrl;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getTimezone}
         * @param timezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#timezone IdentitystoreUser#timezone}.
         * @return {@code this}
         */
        public Builder timezone(java.lang.String timezone) {
            this.timezone = timezone;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getTitle}
         * @param title Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#title IdentitystoreUser#title}.
         * @return {@code this}
         */
        public Builder title(java.lang.String title) {
            this.title = title;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getUserType}
         * @param userType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#user_type IdentitystoreUser#user_type}.
         * @return {@code this}
         */
        public Builder userType(java.lang.String userType) {
            this.userType = userType;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getDependsOn}
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
         * Sets the value of {@link IdentitystoreUserConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserConfig#getProvisioners}
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
         * @return a new instance of {@link IdentitystoreUserConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IdentitystoreUserConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IdentitystoreUserConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IdentitystoreUserConfig {
        private final java.lang.String displayName;
        private final java.lang.String identityStoreId;
        private final imports.aws.identitystore_user.IdentitystoreUserName name;
        private final java.lang.String userName;
        private final imports.aws.identitystore_user.IdentitystoreUserAddresses addresses;
        private final imports.aws.identitystore_user.IdentitystoreUserEmails emails;
        private final java.lang.String id;
        private final java.lang.String locale;
        private final java.lang.String nickname;
        private final imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers phoneNumbers;
        private final java.lang.String preferredLanguage;
        private final java.lang.String profileUrl;
        private final java.lang.String timezone;
        private final java.lang.String title;
        private final java.lang.String userType;
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
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityStoreId = software.amazon.jsii.Kernel.get(this, "identityStoreId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserName.class));
            this.userName = software.amazon.jsii.Kernel.get(this, "userName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.addresses = software.amazon.jsii.Kernel.get(this, "addresses", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserAddresses.class));
            this.emails = software.amazon.jsii.Kernel.get(this, "emails", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserEmails.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.locale = software.amazon.jsii.Kernel.get(this, "locale", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nickname = software.amazon.jsii.Kernel.get(this, "nickname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.phoneNumbers = software.amazon.jsii.Kernel.get(this, "phoneNumbers", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers.class));
            this.preferredLanguage = software.amazon.jsii.Kernel.get(this, "preferredLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.profileUrl = software.amazon.jsii.Kernel.get(this, "profileUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timezone = software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.title = software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userType = software.amazon.jsii.Kernel.get(this, "userType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.displayName = java.util.Objects.requireNonNull(builder.displayName, "displayName is required");
            this.identityStoreId = java.util.Objects.requireNonNull(builder.identityStoreId, "identityStoreId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.userName = java.util.Objects.requireNonNull(builder.userName, "userName is required");
            this.addresses = builder.addresses;
            this.emails = builder.emails;
            this.id = builder.id;
            this.locale = builder.locale;
            this.nickname = builder.nickname;
            this.phoneNumbers = builder.phoneNumbers;
            this.preferredLanguage = builder.preferredLanguage;
            this.profileUrl = builder.profileUrl;
            this.timezone = builder.timezone;
            this.title = builder.title;
            this.userType = builder.userType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.lang.String getIdentityStoreId() {
            return this.identityStoreId;
        }

        @Override
        public final imports.aws.identitystore_user.IdentitystoreUserName getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getUserName() {
            return this.userName;
        }

        @Override
        public final imports.aws.identitystore_user.IdentitystoreUserAddresses getAddresses() {
            return this.addresses;
        }

        @Override
        public final imports.aws.identitystore_user.IdentitystoreUserEmails getEmails() {
            return this.emails;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLocale() {
            return this.locale;
        }

        @Override
        public final java.lang.String getNickname() {
            return this.nickname;
        }

        @Override
        public final imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers getPhoneNumbers() {
            return this.phoneNumbers;
        }

        @Override
        public final java.lang.String getPreferredLanguage() {
            return this.preferredLanguage;
        }

        @Override
        public final java.lang.String getProfileUrl() {
            return this.profileUrl;
        }

        @Override
        public final java.lang.String getTimezone() {
            return this.timezone;
        }

        @Override
        public final java.lang.String getTitle() {
            return this.title;
        }

        @Override
        public final java.lang.String getUserType() {
            return this.userType;
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

            data.set("displayName", om.valueToTree(this.getDisplayName()));
            data.set("identityStoreId", om.valueToTree(this.getIdentityStoreId()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("userName", om.valueToTree(this.getUserName()));
            if (this.getAddresses() != null) {
                data.set("addresses", om.valueToTree(this.getAddresses()));
            }
            if (this.getEmails() != null) {
                data.set("emails", om.valueToTree(this.getEmails()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLocale() != null) {
                data.set("locale", om.valueToTree(this.getLocale()));
            }
            if (this.getNickname() != null) {
                data.set("nickname", om.valueToTree(this.getNickname()));
            }
            if (this.getPhoneNumbers() != null) {
                data.set("phoneNumbers", om.valueToTree(this.getPhoneNumbers()));
            }
            if (this.getPreferredLanguage() != null) {
                data.set("preferredLanguage", om.valueToTree(this.getPreferredLanguage()));
            }
            if (this.getProfileUrl() != null) {
                data.set("profileUrl", om.valueToTree(this.getProfileUrl()));
            }
            if (this.getTimezone() != null) {
                data.set("timezone", om.valueToTree(this.getTimezone()));
            }
            if (this.getTitle() != null) {
                data.set("title", om.valueToTree(this.getTitle()));
            }
            if (this.getUserType() != null) {
                data.set("userType", om.valueToTree(this.getUserType()));
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
            struct.set("fqn", om.valueToTree("aws.identitystoreUser.IdentitystoreUserConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IdentitystoreUserConfig.Jsii$Proxy that = (IdentitystoreUserConfig.Jsii$Proxy) o;

            if (!displayName.equals(that.displayName)) return false;
            if (!identityStoreId.equals(that.identityStoreId)) return false;
            if (!name.equals(that.name)) return false;
            if (!userName.equals(that.userName)) return false;
            if (this.addresses != null ? !this.addresses.equals(that.addresses) : that.addresses != null) return false;
            if (this.emails != null ? !this.emails.equals(that.emails) : that.emails != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.locale != null ? !this.locale.equals(that.locale) : that.locale != null) return false;
            if (this.nickname != null ? !this.nickname.equals(that.nickname) : that.nickname != null) return false;
            if (this.phoneNumbers != null ? !this.phoneNumbers.equals(that.phoneNumbers) : that.phoneNumbers != null) return false;
            if (this.preferredLanguage != null ? !this.preferredLanguage.equals(that.preferredLanguage) : that.preferredLanguage != null) return false;
            if (this.profileUrl != null ? !this.profileUrl.equals(that.profileUrl) : that.profileUrl != null) return false;
            if (this.timezone != null ? !this.timezone.equals(that.timezone) : that.timezone != null) return false;
            if (this.title != null ? !this.title.equals(that.title) : that.title != null) return false;
            if (this.userType != null ? !this.userType.equals(that.userType) : that.userType != null) return false;
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
            int result = this.displayName.hashCode();
            result = 31 * result + (this.identityStoreId.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.userName.hashCode());
            result = 31 * result + (this.addresses != null ? this.addresses.hashCode() : 0);
            result = 31 * result + (this.emails != null ? this.emails.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.locale != null ? this.locale.hashCode() : 0);
            result = 31 * result + (this.nickname != null ? this.nickname.hashCode() : 0);
            result = 31 * result + (this.phoneNumbers != null ? this.phoneNumbers.hashCode() : 0);
            result = 31 * result + (this.preferredLanguage != null ? this.preferredLanguage.hashCode() : 0);
            result = 31 * result + (this.profileUrl != null ? this.profileUrl.hashCode() : 0);
            result = 31 * result + (this.timezone != null ? this.timezone.hashCode() : 0);
            result = 31 * result + (this.title != null ? this.title.hashCode() : 0);
            result = 31 * result + (this.userType != null ? this.userType.hashCode() : 0);
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
