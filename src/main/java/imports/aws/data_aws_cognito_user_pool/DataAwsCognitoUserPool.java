package imports.aws.data_aws_cognito_user_pool;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cognito_user_pool aws_cognito_user_pool}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.521Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCognitoUserPool.DataAwsCognitoUserPool")
public class DataAwsCognitoUserPool extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsCognitoUserPool(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsCognitoUserPool(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPool.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cognito_user_pool aws_cognito_user_pool} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsCognitoUserPool(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsCognitoUserPool resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsCognitoUserPool to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsCognitoUserPool that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsCognitoUserPool to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPool.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsCognitoUserPool resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsCognitoUserPool to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsCognitoUserPool that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPool.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolAccountRecoverySettingList getAccountRecoverySetting() {
        return software.amazon.jsii.Kernel.get(this, "accountRecoverySetting", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolAccountRecoverySettingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolAdminCreateUserConfigList getAdminCreateUserConfig() {
        return software.amazon.jsii.Kernel.get(this, "adminCreateUserConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolAdminCreateUserConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAutoVerifiedAttributes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "autoVerifiedAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreationDate() {
        return software.amazon.jsii.Kernel.get(this, "creationDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomDomain() {
        return software.amazon.jsii.Kernel.get(this, "customDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeletionProtection() {
        return software.amazon.jsii.Kernel.get(this, "deletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolDeviceConfigurationList getDeviceConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "deviceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolDeviceConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomain() {
        return software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolEmailConfigurationList getEmailConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "emailConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolEmailConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEstimatedNumberOfUsers() {
        return software.amazon.jsii.Kernel.get(this, "estimatedNumberOfUsers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfigList getLambdaConfig() {
        return software.amazon.jsii.Kernel.get(this, "lambdaConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastModifiedDate() {
        return software.amazon.jsii.Kernel.get(this, "lastModifiedDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMfaConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "mfaConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolSchemaAttributesList getSchemaAttributes() {
        return software.amazon.jsii.Kernel.get(this, "schemaAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolSchemaAttributesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSmsAuthenticationMessage() {
        return software.amazon.jsii.Kernel.get(this, "smsAuthenticationMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSmsConfigurationFailure() {
        return software.amazon.jsii.Kernel.get(this, "smsConfigurationFailure", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSmsVerificationMessage() {
        return software.amazon.jsii.Kernel.get(this, "smsVerificationMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTags() {
        return software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getUsernameAttributes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "usernameAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolUserPoolAddOnsList getUserPoolAddOns() {
        return software.amazon.jsii.Kernel.get(this, "userPoolAddOns", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolUserPoolAddOnsList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getUserPoolTags() {
        return software.amazon.jsii.Kernel.get(this, "userPoolTags", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "userPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserPoolId() {
        return software.amazon.jsii.Kernel.get(this, "userPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserPoolId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userPoolId", java.util.Objects.requireNonNull(value, "userPoolId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPool}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPool> {
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
        private final imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cognito_user_pool#user_pool_id DataAwsCognitoUserPool#user_pool_id}.
         * <p>
         * @return {@code this}
         * @param userPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cognito_user_pool#user_pool_id DataAwsCognitoUserPool#user_pool_id}. This parameter is required.
         */
        public Builder userPoolId(final java.lang.String userPoolId) {
            this.config.userPoolId(userPoolId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPool}.
         */
        @Override
        public imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPool build() {
            return new imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPool(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
