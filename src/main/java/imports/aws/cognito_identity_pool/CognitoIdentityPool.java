package imports.aws.cognito_identity_pool;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool aws_cognito_identity_pool}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.339Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoIdentityPool.CognitoIdentityPool")
public class CognitoIdentityPool extends com.hashicorp.cdktf.TerraformResource {

    protected CognitoIdentityPool(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoIdentityPool(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cognito_identity_pool.CognitoIdentityPool.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool aws_cognito_identity_pool} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CognitoIdentityPool(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cognito_identity_pool.CognitoIdentityPoolConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CognitoIdentityPool resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CognitoIdentityPool to import. This parameter is required.
     * @param importFromId The id of the existing CognitoIdentityPool that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CognitoIdentityPool to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cognito_identity_pool.CognitoIdentityPool.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CognitoIdentityPool resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CognitoIdentityPool to import. This parameter is required.
     * @param importFromId The id of the existing CognitoIdentityPool that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cognito_identity_pool.CognitoIdentityPool.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCognitoIdentityProviders(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProviders>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProviders> __cast_cd4240 = (java.util.List<imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProviders>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProviders __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCognitoIdentityProviders", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllowClassicFlow() {
        software.amazon.jsii.Kernel.call(this, "resetAllowClassicFlow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowUnauthenticatedIdentities() {
        software.amazon.jsii.Kernel.call(this, "resetAllowUnauthenticatedIdentities", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCognitoIdentityProviders() {
        software.amazon.jsii.Kernel.call(this, "resetCognitoIdentityProviders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeveloperProviderName() {
        software.amazon.jsii.Kernel.call(this, "resetDeveloperProviderName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpenidConnectProviderArns() {
        software.amazon.jsii.Kernel.call(this, "resetOpenidConnectProviderArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSamlProviderArns() {
        software.amazon.jsii.Kernel.call(this, "resetSamlProviderArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportedLoginProviders() {
        software.amazon.jsii.Kernel.call(this, "resetSupportedLoginProviders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProvidersList getCognitoIdentityProviders() {
        return software.amazon.jsii.Kernel.get(this, "cognitoIdentityProviders", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProvidersList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowClassicFlowInput() {
        return software.amazon.jsii.Kernel.get(this, "allowClassicFlowInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowUnauthenticatedIdentitiesInput() {
        return software.amazon.jsii.Kernel.get(this, "allowUnauthenticatedIdentitiesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCognitoIdentityProvidersInput() {
        return software.amazon.jsii.Kernel.get(this, "cognitoIdentityProvidersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeveloperProviderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "developerProviderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityPoolNameInput() {
        return software.amazon.jsii.Kernel.get(this, "identityPoolNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOpenidConnectProviderArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "openidConnectProviderArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSamlProviderArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "samlProviderArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getSupportedLoginProvidersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "supportedLoginProvidersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowClassicFlow() {
        return software.amazon.jsii.Kernel.get(this, "allowClassicFlow", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowClassicFlow(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowClassicFlow", java.util.Objects.requireNonNull(value, "allowClassicFlow is required"));
    }

    public void setAllowClassicFlow(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowClassicFlow", java.util.Objects.requireNonNull(value, "allowClassicFlow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowUnauthenticatedIdentities() {
        return software.amazon.jsii.Kernel.get(this, "allowUnauthenticatedIdentities", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowUnauthenticatedIdentities(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowUnauthenticatedIdentities", java.util.Objects.requireNonNull(value, "allowUnauthenticatedIdentities is required"));
    }

    public void setAllowUnauthenticatedIdentities(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowUnauthenticatedIdentities", java.util.Objects.requireNonNull(value, "allowUnauthenticatedIdentities is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeveloperProviderName() {
        return software.amazon.jsii.Kernel.get(this, "developerProviderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeveloperProviderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "developerProviderName", java.util.Objects.requireNonNull(value, "developerProviderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityPoolName() {
        return software.amazon.jsii.Kernel.get(this, "identityPoolName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityPoolName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityPoolName", java.util.Objects.requireNonNull(value, "identityPoolName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOpenidConnectProviderArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "openidConnectProviderArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOpenidConnectProviderArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "openidConnectProviderArns", java.util.Objects.requireNonNull(value, "openidConnectProviderArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSamlProviderArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "samlProviderArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSamlProviderArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "samlProviderArns", java.util.Objects.requireNonNull(value, "samlProviderArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getSupportedLoginProviders() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "supportedLoginProviders", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSupportedLoginProviders(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "supportedLoginProviders", java.util.Objects.requireNonNull(value, "supportedLoginProviders is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cognito_identity_pool.CognitoIdentityPool}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cognito_identity_pool.CognitoIdentityPool> {
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
        private final imports.aws.cognito_identity_pool.CognitoIdentityPoolConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cognito_identity_pool.CognitoIdentityPoolConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#identity_pool_name CognitoIdentityPool#identity_pool_name}.
         * <p>
         * @return {@code this}
         * @param identityPoolName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#identity_pool_name CognitoIdentityPool#identity_pool_name}. This parameter is required.
         */
        public Builder identityPoolName(final java.lang.String identityPoolName) {
            this.config.identityPoolName(identityPoolName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_classic_flow CognitoIdentityPool#allow_classic_flow}.
         * <p>
         * @return {@code this}
         * @param allowClassicFlow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_classic_flow CognitoIdentityPool#allow_classic_flow}. This parameter is required.
         */
        public Builder allowClassicFlow(final java.lang.Boolean allowClassicFlow) {
            this.config.allowClassicFlow(allowClassicFlow);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_classic_flow CognitoIdentityPool#allow_classic_flow}.
         * <p>
         * @return {@code this}
         * @param allowClassicFlow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_classic_flow CognitoIdentityPool#allow_classic_flow}. This parameter is required.
         */
        public Builder allowClassicFlow(final com.hashicorp.cdktf.IResolvable allowClassicFlow) {
            this.config.allowClassicFlow(allowClassicFlow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_unauthenticated_identities CognitoIdentityPool#allow_unauthenticated_identities}.
         * <p>
         * @return {@code this}
         * @param allowUnauthenticatedIdentities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_unauthenticated_identities CognitoIdentityPool#allow_unauthenticated_identities}. This parameter is required.
         */
        public Builder allowUnauthenticatedIdentities(final java.lang.Boolean allowUnauthenticatedIdentities) {
            this.config.allowUnauthenticatedIdentities(allowUnauthenticatedIdentities);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_unauthenticated_identities CognitoIdentityPool#allow_unauthenticated_identities}.
         * <p>
         * @return {@code this}
         * @param allowUnauthenticatedIdentities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_unauthenticated_identities CognitoIdentityPool#allow_unauthenticated_identities}. This parameter is required.
         */
        public Builder allowUnauthenticatedIdentities(final com.hashicorp.cdktf.IResolvable allowUnauthenticatedIdentities) {
            this.config.allowUnauthenticatedIdentities(allowUnauthenticatedIdentities);
            return this;
        }

        /**
         * cognito_identity_providers block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#cognito_identity_providers CognitoIdentityPool#cognito_identity_providers}
         * <p>
         * @return {@code this}
         * @param cognitoIdentityProviders cognito_identity_providers block. This parameter is required.
         */
        public Builder cognitoIdentityProviders(final com.hashicorp.cdktf.IResolvable cognitoIdentityProviders) {
            this.config.cognitoIdentityProviders(cognitoIdentityProviders);
            return this;
        }
        /**
         * cognito_identity_providers block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#cognito_identity_providers CognitoIdentityPool#cognito_identity_providers}
         * <p>
         * @return {@code this}
         * @param cognitoIdentityProviders cognito_identity_providers block. This parameter is required.
         */
        public Builder cognitoIdentityProviders(final java.util.List<? extends imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProviders> cognitoIdentityProviders) {
            this.config.cognitoIdentityProviders(cognitoIdentityProviders);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#developer_provider_name CognitoIdentityPool#developer_provider_name}.
         * <p>
         * @return {@code this}
         * @param developerProviderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#developer_provider_name CognitoIdentityPool#developer_provider_name}. This parameter is required.
         */
        public Builder developerProviderName(final java.lang.String developerProviderName) {
            this.config.developerProviderName(developerProviderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#id CognitoIdentityPool#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#id CognitoIdentityPool#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#openid_connect_provider_arns CognitoIdentityPool#openid_connect_provider_arns}.
         * <p>
         * @return {@code this}
         * @param openidConnectProviderArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#openid_connect_provider_arns CognitoIdentityPool#openid_connect_provider_arns}. This parameter is required.
         */
        public Builder openidConnectProviderArns(final java.util.List<java.lang.String> openidConnectProviderArns) {
            this.config.openidConnectProviderArns(openidConnectProviderArns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#saml_provider_arns CognitoIdentityPool#saml_provider_arns}.
         * <p>
         * @return {@code this}
         * @param samlProviderArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#saml_provider_arns CognitoIdentityPool#saml_provider_arns}. This parameter is required.
         */
        public Builder samlProviderArns(final java.util.List<java.lang.String> samlProviderArns) {
            this.config.samlProviderArns(samlProviderArns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#supported_login_providers CognitoIdentityPool#supported_login_providers}.
         * <p>
         * @return {@code this}
         * @param supportedLoginProviders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#supported_login_providers CognitoIdentityPool#supported_login_providers}. This parameter is required.
         */
        public Builder supportedLoginProviders(final java.util.Map<java.lang.String, java.lang.String> supportedLoginProviders) {
            this.config.supportedLoginProviders(supportedLoginProviders);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#tags CognitoIdentityPool#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#tags CognitoIdentityPool#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#tags_all CognitoIdentityPool#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#tags_all CognitoIdentityPool#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cognito_identity_pool.CognitoIdentityPool}.
         */
        @Override
        public imports.aws.cognito_identity_pool.CognitoIdentityPool build() {
            return new imports.aws.cognito_identity_pool.CognitoIdentityPool(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
