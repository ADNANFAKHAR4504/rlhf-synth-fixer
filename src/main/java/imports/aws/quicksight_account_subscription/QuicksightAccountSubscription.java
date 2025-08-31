package imports.aws.quicksight_account_subscription;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription aws_quicksight_account_subscription}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightAccountSubscription.QuicksightAccountSubscription")
public class QuicksightAccountSubscription extends com.hashicorp.cdktf.TerraformResource {

    protected QuicksightAccountSubscription(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightAccountSubscription(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.quicksight_account_subscription.QuicksightAccountSubscription.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription aws_quicksight_account_subscription} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public QuicksightAccountSubscription(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a QuicksightAccountSubscription resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightAccountSubscription to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightAccountSubscription that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the QuicksightAccountSubscription to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_account_subscription.QuicksightAccountSubscription.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a QuicksightAccountSubscription resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightAccountSubscription to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightAccountSubscription that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_account_subscription.QuicksightAccountSubscription.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActiveDirectoryName() {
        software.amazon.jsii.Kernel.call(this, "resetActiveDirectoryName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdminGroup() {
        software.amazon.jsii.Kernel.call(this, "resetAdminGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthorGroup() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContactNumber() {
        software.amazon.jsii.Kernel.call(this, "resetContactNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDirectoryId() {
        software.amazon.jsii.Kernel.call(this, "resetDirectoryId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmailAddress() {
        software.amazon.jsii.Kernel.call(this, "resetEmailAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirstName() {
        software.amazon.jsii.Kernel.call(this, "resetFirstName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamIdentityCenterInstanceArn() {
        software.amazon.jsii.Kernel.call(this, "resetIamIdentityCenterInstanceArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastName() {
        software.amazon.jsii.Kernel.call(this, "resetLastName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReaderGroup() {
        software.amazon.jsii.Kernel.call(this, "resetReaderGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRealm() {
        software.amazon.jsii.Kernel.call(this, "resetRealm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountSubscriptionStatus() {
        return software.amazon.jsii.Kernel.get(this, "accountSubscriptionStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountNameInput() {
        return software.amazon.jsii.Kernel.get(this, "accountNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActiveDirectoryNameInput() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdminGroupInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "adminGroupInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationMethodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAuthorGroupInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "authorGroupInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContactNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "contactNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryIdInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEditionInput() {
        return software.amazon.jsii.Kernel.get(this, "editionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "emailAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirstNameInput() {
        return software.amazon.jsii.Kernel.get(this, "firstNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamIdentityCenterInstanceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "iamIdentityCenterInstanceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLastNameInput() {
        return software.amazon.jsii.Kernel.get(this, "lastNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNotificationEmailInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationEmailInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReaderGroupInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "readerGroupInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRealmInput() {
        return software.amazon.jsii.Kernel.get(this, "realmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountName() {
        return software.amazon.jsii.Kernel.get(this, "accountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountName", java.util.Objects.requireNonNull(value, "accountName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActiveDirectoryName() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setActiveDirectoryName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "activeDirectoryName", java.util.Objects.requireNonNull(value, "activeDirectoryName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdminGroup() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "adminGroup", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdminGroup(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "adminGroup", java.util.Objects.requireNonNull(value, "adminGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationMethod() {
        return software.amazon.jsii.Kernel.get(this, "authenticationMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthenticationMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authenticationMethod", java.util.Objects.requireNonNull(value, "authenticationMethod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAuthorGroup() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "authorGroup", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAuthorGroup(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "authorGroup", java.util.Objects.requireNonNull(value, "authorGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsAccountId", java.util.Objects.requireNonNull(value, "awsAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContactNumber() {
        return software.amazon.jsii.Kernel.get(this, "contactNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContactNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contactNumber", java.util.Objects.requireNonNull(value, "contactNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId() {
        return software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryId", java.util.Objects.requireNonNull(value, "directoryId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEdition() {
        return software.amazon.jsii.Kernel.get(this, "edition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEdition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "edition", java.util.Objects.requireNonNull(value, "edition is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getIamIdentityCenterInstanceArn() {
        return software.amazon.jsii.Kernel.get(this, "iamIdentityCenterInstanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamIdentityCenterInstanceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamIdentityCenterInstanceArn", java.util.Objects.requireNonNull(value, "iamIdentityCenterInstanceArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getNotificationEmail() {
        return software.amazon.jsii.Kernel.get(this, "notificationEmail", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNotificationEmail(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "notificationEmail", java.util.Objects.requireNonNull(value, "notificationEmail is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getReaderGroup() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "readerGroup", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setReaderGroup(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "readerGroup", java.util.Objects.requireNonNull(value, "readerGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRealm() {
        return software.amazon.jsii.Kernel.get(this, "realm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRealm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "realm", java.util.Objects.requireNonNull(value, "realm is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.quicksight_account_subscription.QuicksightAccountSubscription}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.quicksight_account_subscription.QuicksightAccountSubscription> {
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
        private final imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#account_name QuicksightAccountSubscription#account_name}.
         * <p>
         * @return {@code this}
         * @param accountName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#account_name QuicksightAccountSubscription#account_name}. This parameter is required.
         */
        public Builder accountName(final java.lang.String accountName) {
            this.config.accountName(accountName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#authentication_method QuicksightAccountSubscription#authentication_method}.
         * <p>
         * @return {@code this}
         * @param authenticationMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#authentication_method QuicksightAccountSubscription#authentication_method}. This parameter is required.
         */
        public Builder authenticationMethod(final java.lang.String authenticationMethod) {
            this.config.authenticationMethod(authenticationMethod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#edition QuicksightAccountSubscription#edition}.
         * <p>
         * @return {@code this}
         * @param edition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#edition QuicksightAccountSubscription#edition}. This parameter is required.
         */
        public Builder edition(final java.lang.String edition) {
            this.config.edition(edition);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#notification_email QuicksightAccountSubscription#notification_email}.
         * <p>
         * @return {@code this}
         * @param notificationEmail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#notification_email QuicksightAccountSubscription#notification_email}. This parameter is required.
         */
        public Builder notificationEmail(final java.lang.String notificationEmail) {
            this.config.notificationEmail(notificationEmail);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#active_directory_name QuicksightAccountSubscription#active_directory_name}.
         * <p>
         * @return {@code this}
         * @param activeDirectoryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#active_directory_name QuicksightAccountSubscription#active_directory_name}. This parameter is required.
         */
        public Builder activeDirectoryName(final java.lang.String activeDirectoryName) {
            this.config.activeDirectoryName(activeDirectoryName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#admin_group QuicksightAccountSubscription#admin_group}.
         * <p>
         * @return {@code this}
         * @param adminGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#admin_group QuicksightAccountSubscription#admin_group}. This parameter is required.
         */
        public Builder adminGroup(final java.util.List<java.lang.String> adminGroup) {
            this.config.adminGroup(adminGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#author_group QuicksightAccountSubscription#author_group}.
         * <p>
         * @return {@code this}
         * @param authorGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#author_group QuicksightAccountSubscription#author_group}. This parameter is required.
         */
        public Builder authorGroup(final java.util.List<java.lang.String> authorGroup) {
            this.config.authorGroup(authorGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#aws_account_id QuicksightAccountSubscription#aws_account_id}.
         * <p>
         * @return {@code this}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#aws_account_id QuicksightAccountSubscription#aws_account_id}. This parameter is required.
         */
        public Builder awsAccountId(final java.lang.String awsAccountId) {
            this.config.awsAccountId(awsAccountId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#contact_number QuicksightAccountSubscription#contact_number}.
         * <p>
         * @return {@code this}
         * @param contactNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#contact_number QuicksightAccountSubscription#contact_number}. This parameter is required.
         */
        public Builder contactNumber(final java.lang.String contactNumber) {
            this.config.contactNumber(contactNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#directory_id QuicksightAccountSubscription#directory_id}.
         * <p>
         * @return {@code this}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#directory_id QuicksightAccountSubscription#directory_id}. This parameter is required.
         */
        public Builder directoryId(final java.lang.String directoryId) {
            this.config.directoryId(directoryId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#email_address QuicksightAccountSubscription#email_address}.
         * <p>
         * @return {@code this}
         * @param emailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#email_address QuicksightAccountSubscription#email_address}. This parameter is required.
         */
        public Builder emailAddress(final java.lang.String emailAddress) {
            this.config.emailAddress(emailAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#first_name QuicksightAccountSubscription#first_name}.
         * <p>
         * @return {@code this}
         * @param firstName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#first_name QuicksightAccountSubscription#first_name}. This parameter is required.
         */
        public Builder firstName(final java.lang.String firstName) {
            this.config.firstName(firstName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#iam_identity_center_instance_arn QuicksightAccountSubscription#iam_identity_center_instance_arn}.
         * <p>
         * @return {@code this}
         * @param iamIdentityCenterInstanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#iam_identity_center_instance_arn QuicksightAccountSubscription#iam_identity_center_instance_arn}. This parameter is required.
         */
        public Builder iamIdentityCenterInstanceArn(final java.lang.String iamIdentityCenterInstanceArn) {
            this.config.iamIdentityCenterInstanceArn(iamIdentityCenterInstanceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#id QuicksightAccountSubscription#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#id QuicksightAccountSubscription#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#last_name QuicksightAccountSubscription#last_name}.
         * <p>
         * @return {@code this}
         * @param lastName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#last_name QuicksightAccountSubscription#last_name}. This parameter is required.
         */
        public Builder lastName(final java.lang.String lastName) {
            this.config.lastName(lastName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#reader_group QuicksightAccountSubscription#reader_group}.
         * <p>
         * @return {@code this}
         * @param readerGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#reader_group QuicksightAccountSubscription#reader_group}. This parameter is required.
         */
        public Builder readerGroup(final java.util.List<java.lang.String> readerGroup) {
            this.config.readerGroup(readerGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#realm QuicksightAccountSubscription#realm}.
         * <p>
         * @return {@code this}
         * @param realm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#realm QuicksightAccountSubscription#realm}. This parameter is required.
         */
        public Builder realm(final java.lang.String realm) {
            this.config.realm(realm);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#timeouts QuicksightAccountSubscription#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.quicksight_account_subscription.QuicksightAccountSubscription}.
         */
        @Override
        public imports.aws.quicksight_account_subscription.QuicksightAccountSubscription build() {
            return new imports.aws.quicksight_account_subscription.QuicksightAccountSubscription(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
