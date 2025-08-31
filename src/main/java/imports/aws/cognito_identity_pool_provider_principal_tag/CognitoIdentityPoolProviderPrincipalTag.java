package imports.aws.cognito_identity_pool_provider_principal_tag;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag aws_cognito_identity_pool_provider_principal_tag}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.339Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoIdentityPoolProviderPrincipalTag.CognitoIdentityPoolProviderPrincipalTag")
public class CognitoIdentityPoolProviderPrincipalTag extends com.hashicorp.cdktf.TerraformResource {

    protected CognitoIdentityPoolProviderPrincipalTag(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoIdentityPoolProviderPrincipalTag(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTag.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag aws_cognito_identity_pool_provider_principal_tag} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CognitoIdentityPoolProviderPrincipalTag(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTagConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CognitoIdentityPoolProviderPrincipalTag resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CognitoIdentityPoolProviderPrincipalTag to import. This parameter is required.
     * @param importFromId The id of the existing CognitoIdentityPoolProviderPrincipalTag that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CognitoIdentityPoolProviderPrincipalTag to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTag.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CognitoIdentityPoolProviderPrincipalTag resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CognitoIdentityPoolProviderPrincipalTag to import. This parameter is required.
     * @param importFromId The id of the existing CognitoIdentityPoolProviderPrincipalTag that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTag.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrincipalTags() {
        software.amazon.jsii.Kernel.call(this, "resetPrincipalTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseDefaults() {
        software.amazon.jsii.Kernel.call(this, "resetUseDefaults", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "identityPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityProviderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getPrincipalTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "principalTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseDefaultsInput() {
        return software.amazon.jsii.Kernel.get(this, "useDefaultsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityPoolId() {
        return software.amazon.jsii.Kernel.get(this, "identityPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityPoolId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityPoolId", java.util.Objects.requireNonNull(value, "identityPoolId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityProviderName() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityProviderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityProviderName", java.util.Objects.requireNonNull(value, "identityProviderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getPrincipalTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "principalTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPrincipalTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "principalTags", java.util.Objects.requireNonNull(value, "principalTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseDefaults() {
        return software.amazon.jsii.Kernel.get(this, "useDefaults", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseDefaults(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useDefaults", java.util.Objects.requireNonNull(value, "useDefaults is required"));
    }

    public void setUseDefaults(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useDefaults", java.util.Objects.requireNonNull(value, "useDefaults is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTag}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTag> {
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
        private final imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTagConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTagConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#identity_pool_id CognitoIdentityPoolProviderPrincipalTag#identity_pool_id}.
         * <p>
         * @return {@code this}
         * @param identityPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#identity_pool_id CognitoIdentityPoolProviderPrincipalTag#identity_pool_id}. This parameter is required.
         */
        public Builder identityPoolId(final java.lang.String identityPoolId) {
            this.config.identityPoolId(identityPoolId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#identity_provider_name CognitoIdentityPoolProviderPrincipalTag#identity_provider_name}.
         * <p>
         * @return {@code this}
         * @param identityProviderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#identity_provider_name CognitoIdentityPoolProviderPrincipalTag#identity_provider_name}. This parameter is required.
         */
        public Builder identityProviderName(final java.lang.String identityProviderName) {
            this.config.identityProviderName(identityProviderName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#id CognitoIdentityPoolProviderPrincipalTag#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#id CognitoIdentityPoolProviderPrincipalTag#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#principal_tags CognitoIdentityPoolProviderPrincipalTag#principal_tags}.
         * <p>
         * @return {@code this}
         * @param principalTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#principal_tags CognitoIdentityPoolProviderPrincipalTag#principal_tags}. This parameter is required.
         */
        public Builder principalTags(final java.util.Map<java.lang.String, java.lang.String> principalTags) {
            this.config.principalTags(principalTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#use_defaults CognitoIdentityPoolProviderPrincipalTag#use_defaults}.
         * <p>
         * @return {@code this}
         * @param useDefaults Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#use_defaults CognitoIdentityPoolProviderPrincipalTag#use_defaults}. This parameter is required.
         */
        public Builder useDefaults(final java.lang.Boolean useDefaults) {
            this.config.useDefaults(useDefaults);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#use_defaults CognitoIdentityPoolProviderPrincipalTag#use_defaults}.
         * <p>
         * @return {@code this}
         * @param useDefaults Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_provider_principal_tag#use_defaults CognitoIdentityPoolProviderPrincipalTag#use_defaults}. This parameter is required.
         */
        public Builder useDefaults(final com.hashicorp.cdktf.IResolvable useDefaults) {
            this.config.useDefaults(useDefaults);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTag}.
         */
        @Override
        public imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTag build() {
            return new imports.aws.cognito_identity_pool_provider_principal_tag.CognitoIdentityPoolProviderPrincipalTag(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
