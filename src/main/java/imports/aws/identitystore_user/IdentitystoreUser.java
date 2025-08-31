package imports.aws.identitystore_user;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user aws_identitystore_user}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.identitystoreUser.IdentitystoreUser")
public class IdentitystoreUser extends com.hashicorp.cdktf.TerraformResource {

    protected IdentitystoreUser(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IdentitystoreUser(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.identitystore_user.IdentitystoreUser.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user aws_identitystore_user} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public IdentitystoreUser(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a IdentitystoreUser resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the IdentitystoreUser to import. This parameter is required.
     * @param importFromId The id of the existing IdentitystoreUser that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the IdentitystoreUser to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.identitystore_user.IdentitystoreUser.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a IdentitystoreUser resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the IdentitystoreUser to import. This parameter is required.
     * @param importFromId The id of the existing IdentitystoreUser that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.identitystore_user.IdentitystoreUser.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAddresses(final @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserAddresses value) {
        software.amazon.jsii.Kernel.call(this, "putAddresses", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEmails(final @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserEmails value) {
        software.amazon.jsii.Kernel.call(this, "putEmails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putName(final @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserName value) {
        software.amazon.jsii.Kernel.call(this, "putName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPhoneNumbers(final @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers value) {
        software.amazon.jsii.Kernel.call(this, "putPhoneNumbers", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAddresses() {
        software.amazon.jsii.Kernel.call(this, "resetAddresses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmails() {
        software.amazon.jsii.Kernel.call(this, "resetEmails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocale() {
        software.amazon.jsii.Kernel.call(this, "resetLocale", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNickname() {
        software.amazon.jsii.Kernel.call(this, "resetNickname", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPhoneNumbers() {
        software.amazon.jsii.Kernel.call(this, "resetPhoneNumbers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredLanguage() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredLanguage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProfileUrl() {
        software.amazon.jsii.Kernel.call(this, "resetProfileUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimezone() {
        software.amazon.jsii.Kernel.call(this, "resetTimezone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTitle() {
        software.amazon.jsii.Kernel.call(this, "resetTitle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserType() {
        software.amazon.jsii.Kernel.call(this, "resetUserType", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserAddressesOutputReference getAddresses() {
        return software.amazon.jsii.Kernel.get(this, "addresses", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserAddressesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserEmailsOutputReference getEmails() {
        return software.amazon.jsii.Kernel.get(this, "emails", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserEmailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserExternalIdsList getExternalIds() {
        return software.amazon.jsii.Kernel.get(this, "externalIds", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserExternalIdsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserNameOutputReference getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserNameOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.identitystore_user.IdentitystoreUserPhoneNumbersOutputReference getPhoneNumbers() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumbers", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserPhoneNumbersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserId() {
        return software.amazon.jsii.Kernel.get(this, "userId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserAddresses getAddressesInput() {
        return software.amazon.jsii.Kernel.get(this, "addressesInput", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserAddresses.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDisplayNameInput() {
        return software.amazon.jsii.Kernel.get(this, "displayNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserEmails getEmailsInput() {
        return software.amazon.jsii.Kernel.get(this, "emailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserEmails.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityStoreIdInput() {
        return software.amazon.jsii.Kernel.get(this, "identityStoreIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocaleInput() {
        return software.amazon.jsii.Kernel.get(this, "localeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserName getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserName.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNicknameInput() {
        return software.amazon.jsii.Kernel.get(this, "nicknameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers getPhoneNumbersInput() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumbersInput", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredLanguageInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredLanguageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProfileUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "profileUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimezoneInput() {
        return software.amazon.jsii.Kernel.get(this, "timezoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTitleInput() {
        return software.amazon.jsii.Kernel.get(this, "titleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserNameInput() {
        return software.amazon.jsii.Kernel.get(this, "userNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "userTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDisplayName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "displayName", java.util.Objects.requireNonNull(value, "displayName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityStoreId() {
        return software.amazon.jsii.Kernel.get(this, "identityStoreId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityStoreId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityStoreId", java.util.Objects.requireNonNull(value, "identityStoreId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocale() {
        return software.amazon.jsii.Kernel.get(this, "locale", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocale(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "locale", java.util.Objects.requireNonNull(value, "locale is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNickname() {
        return software.amazon.jsii.Kernel.get(this, "nickname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNickname(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nickname", java.util.Objects.requireNonNull(value, "nickname is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredLanguage() {
        return software.amazon.jsii.Kernel.get(this, "preferredLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreferredLanguage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preferredLanguage", java.util.Objects.requireNonNull(value, "preferredLanguage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfileUrl() {
        return software.amazon.jsii.Kernel.get(this, "profileUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProfileUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "profileUrl", java.util.Objects.requireNonNull(value, "profileUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimezone() {
        return software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimezone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timezone", java.util.Objects.requireNonNull(value, "timezone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTitle(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "title", java.util.Objects.requireNonNull(value, "title is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserName() {
        return software.amazon.jsii.Kernel.get(this, "userName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userName", java.util.Objects.requireNonNull(value, "userName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserType() {
        return software.amazon.jsii.Kernel.get(this, "userType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userType", java.util.Objects.requireNonNull(value, "userType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.identitystore_user.IdentitystoreUser}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.identitystore_user.IdentitystoreUser> {
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
        private final imports.aws.identitystore_user.IdentitystoreUserConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.identitystore_user.IdentitystoreUserConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#display_name IdentitystoreUser#display_name}.
         * <p>
         * @return {@code this}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#display_name IdentitystoreUser#display_name}. This parameter is required.
         */
        public Builder displayName(final java.lang.String displayName) {
            this.config.displayName(displayName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#identity_store_id IdentitystoreUser#identity_store_id}.
         * <p>
         * @return {@code this}
         * @param identityStoreId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#identity_store_id IdentitystoreUser#identity_store_id}. This parameter is required.
         */
        public Builder identityStoreId(final java.lang.String identityStoreId) {
            this.config.identityStoreId(identityStoreId);
            return this;
        }

        /**
         * name block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#name IdentitystoreUser#name}
         * <p>
         * @return {@code this}
         * @param name name block. This parameter is required.
         */
        public Builder name(final imports.aws.identitystore_user.IdentitystoreUserName name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#user_name IdentitystoreUser#user_name}.
         * <p>
         * @return {@code this}
         * @param userName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#user_name IdentitystoreUser#user_name}. This parameter is required.
         */
        public Builder userName(final java.lang.String userName) {
            this.config.userName(userName);
            return this;
        }

        /**
         * addresses block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#addresses IdentitystoreUser#addresses}
         * <p>
         * @return {@code this}
         * @param addresses addresses block. This parameter is required.
         */
        public Builder addresses(final imports.aws.identitystore_user.IdentitystoreUserAddresses addresses) {
            this.config.addresses(addresses);
            return this;
        }

        /**
         * emails block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#emails IdentitystoreUser#emails}
         * <p>
         * @return {@code this}
         * @param emails emails block. This parameter is required.
         */
        public Builder emails(final imports.aws.identitystore_user.IdentitystoreUserEmails emails) {
            this.config.emails(emails);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#id IdentitystoreUser#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#id IdentitystoreUser#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#locale IdentitystoreUser#locale}.
         * <p>
         * @return {@code this}
         * @param locale Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#locale IdentitystoreUser#locale}. This parameter is required.
         */
        public Builder locale(final java.lang.String locale) {
            this.config.locale(locale);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#nickname IdentitystoreUser#nickname}.
         * <p>
         * @return {@code this}
         * @param nickname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#nickname IdentitystoreUser#nickname}. This parameter is required.
         */
        public Builder nickname(final java.lang.String nickname) {
            this.config.nickname(nickname);
            return this;
        }

        /**
         * phone_numbers block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#phone_numbers IdentitystoreUser#phone_numbers}
         * <p>
         * @return {@code this}
         * @param phoneNumbers phone_numbers block. This parameter is required.
         */
        public Builder phoneNumbers(final imports.aws.identitystore_user.IdentitystoreUserPhoneNumbers phoneNumbers) {
            this.config.phoneNumbers(phoneNumbers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#preferred_language IdentitystoreUser#preferred_language}.
         * <p>
         * @return {@code this}
         * @param preferredLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#preferred_language IdentitystoreUser#preferred_language}. This parameter is required.
         */
        public Builder preferredLanguage(final java.lang.String preferredLanguage) {
            this.config.preferredLanguage(preferredLanguage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#profile_url IdentitystoreUser#profile_url}.
         * <p>
         * @return {@code this}
         * @param profileUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#profile_url IdentitystoreUser#profile_url}. This parameter is required.
         */
        public Builder profileUrl(final java.lang.String profileUrl) {
            this.config.profileUrl(profileUrl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#timezone IdentitystoreUser#timezone}.
         * <p>
         * @return {@code this}
         * @param timezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#timezone IdentitystoreUser#timezone}. This parameter is required.
         */
        public Builder timezone(final java.lang.String timezone) {
            this.config.timezone(timezone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#title IdentitystoreUser#title}.
         * <p>
         * @return {@code this}
         * @param title Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#title IdentitystoreUser#title}. This parameter is required.
         */
        public Builder title(final java.lang.String title) {
            this.config.title(title);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#user_type IdentitystoreUser#user_type}.
         * <p>
         * @return {@code this}
         * @param userType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#user_type IdentitystoreUser#user_type}. This parameter is required.
         */
        public Builder userType(final java.lang.String userType) {
            this.config.userType(userType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.identitystore_user.IdentitystoreUser}.
         */
        @Override
        public imports.aws.identitystore_user.IdentitystoreUser build() {
            return new imports.aws.identitystore_user.IdentitystoreUser(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
