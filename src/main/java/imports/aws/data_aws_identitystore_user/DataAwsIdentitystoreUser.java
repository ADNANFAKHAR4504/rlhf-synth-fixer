package imports.aws.data_aws_identitystore_user;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user aws_identitystore_user}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreUser.DataAwsIdentitystoreUser")
public class DataAwsIdentitystoreUser extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsIdentitystoreUser(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIdentitystoreUser(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUser.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user aws_identitystore_user} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsIdentitystoreUser(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsIdentitystoreUser resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsIdentitystoreUser to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsIdentitystoreUser that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsIdentitystoreUser to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUser.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsIdentitystoreUser resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsIdentitystoreUser to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsIdentitystoreUser that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUser.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAlternateIdentifier(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifier value) {
        software.amazon.jsii.Kernel.call(this, "putAlternateIdentifier", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilter(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilter value) {
        software.amazon.jsii.Kernel.call(this, "putFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAlternateIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetAlternateIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilter() {
        software.amazon.jsii.Kernel.call(this, "resetFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserId() {
        software.amazon.jsii.Kernel.call(this, "resetUserId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAddressesList getAddresses() {
        return software.amazon.jsii.Kernel.get(this, "addresses", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAddressesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierOutputReference getAlternateIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "alternateIdentifier", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserEmailsList getEmails() {
        return software.amazon.jsii.Kernel.get(this, "emails", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserEmailsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserExternalIdsList getExternalIds() {
        return software.amazon.jsii.Kernel.get(this, "externalIds", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserExternalIdsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilterOutputReference getFilter() {
        return software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocale() {
        return software.amazon.jsii.Kernel.get(this, "locale", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserNameList getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserNameList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNickname() {
        return software.amazon.jsii.Kernel.get(this, "nickname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserPhoneNumbersList getPhoneNumbers() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumbers", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserPhoneNumbersList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredLanguage() {
        return software.amazon.jsii.Kernel.get(this, "preferredLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfileUrl() {
        return software.amazon.jsii.Kernel.get(this, "profileUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimezone() {
        return software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserName() {
        return software.amazon.jsii.Kernel.get(this, "userName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserType() {
        return software.amazon.jsii.Kernel.get(this, "userType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifier getAlternateIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "alternateIdentifierInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifier.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilter getFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "filterInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilter.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityStoreIdInput() {
        return software.amazon.jsii.Kernel.get(this, "identityStoreIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserIdInput() {
        return software.amazon.jsii.Kernel.get(this, "userIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getUserId() {
        return software.amazon.jsii.Kernel.get(this, "userId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userId", java.util.Objects.requireNonNull(value, "userId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUser}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUser> {
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
        private final imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#identity_store_id DataAwsIdentitystoreUser#identity_store_id}.
         * <p>
         * @return {@code this}
         * @param identityStoreId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#identity_store_id DataAwsIdentitystoreUser#identity_store_id}. This parameter is required.
         */
        public Builder identityStoreId(final java.lang.String identityStoreId) {
            this.config.identityStoreId(identityStoreId);
            return this;
        }

        /**
         * alternate_identifier block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#alternate_identifier DataAwsIdentitystoreUser#alternate_identifier}
         * <p>
         * @return {@code this}
         * @param alternateIdentifier alternate_identifier block. This parameter is required.
         */
        public Builder alternateIdentifier(final imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifier alternateIdentifier) {
            this.config.alternateIdentifier(alternateIdentifier);
            return this;
        }

        /**
         * filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#filter DataAwsIdentitystoreUser#filter}
         * <p>
         * @return {@code this}
         * @param filter filter block. This parameter is required.
         */
        public Builder filter(final imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserFilter filter) {
            this.config.filter(filter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#id DataAwsIdentitystoreUser#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#id DataAwsIdentitystoreUser#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#user_id DataAwsIdentitystoreUser#user_id}.
         * <p>
         * @return {@code this}
         * @param userId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#user_id DataAwsIdentitystoreUser#user_id}. This parameter is required.
         */
        public Builder userId(final java.lang.String userId) {
            this.config.userId(userId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUser}.
         */
        @Override
        public imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUser build() {
            return new imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUser(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
