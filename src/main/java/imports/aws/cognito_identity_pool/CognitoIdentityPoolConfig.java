package imports.aws.cognito_identity_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.339Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoIdentityPool.CognitoIdentityPoolConfig")
@software.amazon.jsii.Jsii.Proxy(CognitoIdentityPoolConfig.Jsii$Proxy.class)
public interface CognitoIdentityPoolConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#identity_pool_name CognitoIdentityPool#identity_pool_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentityPoolName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_classic_flow CognitoIdentityPool#allow_classic_flow}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowClassicFlow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_unauthenticated_identities CognitoIdentityPool#allow_unauthenticated_identities}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowUnauthenticatedIdentities() {
        return null;
    }

    /**
     * cognito_identity_providers block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#cognito_identity_providers CognitoIdentityPool#cognito_identity_providers}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCognitoIdentityProviders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#developer_provider_name CognitoIdentityPool#developer_provider_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeveloperProviderName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#id CognitoIdentityPool#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#openid_connect_provider_arns CognitoIdentityPool#openid_connect_provider_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOpenidConnectProviderArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#saml_provider_arns CognitoIdentityPool#saml_provider_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSamlProviderArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#supported_login_providers CognitoIdentityPool#supported_login_providers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getSupportedLoginProviders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#tags CognitoIdentityPool#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#tags_all CognitoIdentityPool#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoIdentityPoolConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoIdentityPoolConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoIdentityPoolConfig> {
        java.lang.String identityPoolName;
        java.lang.Object allowClassicFlow;
        java.lang.Object allowUnauthenticatedIdentities;
        java.lang.Object cognitoIdentityProviders;
        java.lang.String developerProviderName;
        java.lang.String id;
        java.util.List<java.lang.String> openidConnectProviderArns;
        java.util.List<java.lang.String> samlProviderArns;
        java.util.Map<java.lang.String, java.lang.String> supportedLoginProviders;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getIdentityPoolName}
         * @param identityPoolName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#identity_pool_name CognitoIdentityPool#identity_pool_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder identityPoolName(java.lang.String identityPoolName) {
            this.identityPoolName = identityPoolName;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getAllowClassicFlow}
         * @param allowClassicFlow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_classic_flow CognitoIdentityPool#allow_classic_flow}.
         * @return {@code this}
         */
        public Builder allowClassicFlow(java.lang.Boolean allowClassicFlow) {
            this.allowClassicFlow = allowClassicFlow;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getAllowClassicFlow}
         * @param allowClassicFlow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_classic_flow CognitoIdentityPool#allow_classic_flow}.
         * @return {@code this}
         */
        public Builder allowClassicFlow(com.hashicorp.cdktf.IResolvable allowClassicFlow) {
            this.allowClassicFlow = allowClassicFlow;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getAllowUnauthenticatedIdentities}
         * @param allowUnauthenticatedIdentities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_unauthenticated_identities CognitoIdentityPool#allow_unauthenticated_identities}.
         * @return {@code this}
         */
        public Builder allowUnauthenticatedIdentities(java.lang.Boolean allowUnauthenticatedIdentities) {
            this.allowUnauthenticatedIdentities = allowUnauthenticatedIdentities;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getAllowUnauthenticatedIdentities}
         * @param allowUnauthenticatedIdentities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#allow_unauthenticated_identities CognitoIdentityPool#allow_unauthenticated_identities}.
         * @return {@code this}
         */
        public Builder allowUnauthenticatedIdentities(com.hashicorp.cdktf.IResolvable allowUnauthenticatedIdentities) {
            this.allowUnauthenticatedIdentities = allowUnauthenticatedIdentities;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getCognitoIdentityProviders}
         * @param cognitoIdentityProviders cognito_identity_providers block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#cognito_identity_providers CognitoIdentityPool#cognito_identity_providers}
         * @return {@code this}
         */
        public Builder cognitoIdentityProviders(com.hashicorp.cdktf.IResolvable cognitoIdentityProviders) {
            this.cognitoIdentityProviders = cognitoIdentityProviders;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getCognitoIdentityProviders}
         * @param cognitoIdentityProviders cognito_identity_providers block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#cognito_identity_providers CognitoIdentityPool#cognito_identity_providers}
         * @return {@code this}
         */
        public Builder cognitoIdentityProviders(java.util.List<? extends imports.aws.cognito_identity_pool.CognitoIdentityPoolCognitoIdentityProviders> cognitoIdentityProviders) {
            this.cognitoIdentityProviders = cognitoIdentityProviders;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getDeveloperProviderName}
         * @param developerProviderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#developer_provider_name CognitoIdentityPool#developer_provider_name}.
         * @return {@code this}
         */
        public Builder developerProviderName(java.lang.String developerProviderName) {
            this.developerProviderName = developerProviderName;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#id CognitoIdentityPool#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getOpenidConnectProviderArns}
         * @param openidConnectProviderArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#openid_connect_provider_arns CognitoIdentityPool#openid_connect_provider_arns}.
         * @return {@code this}
         */
        public Builder openidConnectProviderArns(java.util.List<java.lang.String> openidConnectProviderArns) {
            this.openidConnectProviderArns = openidConnectProviderArns;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getSamlProviderArns}
         * @param samlProviderArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#saml_provider_arns CognitoIdentityPool#saml_provider_arns}.
         * @return {@code this}
         */
        public Builder samlProviderArns(java.util.List<java.lang.String> samlProviderArns) {
            this.samlProviderArns = samlProviderArns;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getSupportedLoginProviders}
         * @param supportedLoginProviders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#supported_login_providers CognitoIdentityPool#supported_login_providers}.
         * @return {@code this}
         */
        public Builder supportedLoginProviders(java.util.Map<java.lang.String, java.lang.String> supportedLoginProviders) {
            this.supportedLoginProviders = supportedLoginProviders;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#tags CognitoIdentityPool#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool#tags_all CognitoIdentityPool#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getDependsOn}
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
         * Sets the value of {@link CognitoIdentityPoolConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolConfig#getProvisioners}
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
         * @return a new instance of {@link CognitoIdentityPoolConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoIdentityPoolConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoIdentityPoolConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoIdentityPoolConfig {
        private final java.lang.String identityPoolName;
        private final java.lang.Object allowClassicFlow;
        private final java.lang.Object allowUnauthenticatedIdentities;
        private final java.lang.Object cognitoIdentityProviders;
        private final java.lang.String developerProviderName;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> openidConnectProviderArns;
        private final java.util.List<java.lang.String> samlProviderArns;
        private final java.util.Map<java.lang.String, java.lang.String> supportedLoginProviders;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.identityPoolName = software.amazon.jsii.Kernel.get(this, "identityPoolName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowClassicFlow = software.amazon.jsii.Kernel.get(this, "allowClassicFlow", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowUnauthenticatedIdentities = software.amazon.jsii.Kernel.get(this, "allowUnauthenticatedIdentities", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cognitoIdentityProviders = software.amazon.jsii.Kernel.get(this, "cognitoIdentityProviders", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.developerProviderName = software.amazon.jsii.Kernel.get(this, "developerProviderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.openidConnectProviderArns = software.amazon.jsii.Kernel.get(this, "openidConnectProviderArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.samlProviderArns = software.amazon.jsii.Kernel.get(this, "samlProviderArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.supportedLoginProviders = software.amazon.jsii.Kernel.get(this, "supportedLoginProviders", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.identityPoolName = java.util.Objects.requireNonNull(builder.identityPoolName, "identityPoolName is required");
            this.allowClassicFlow = builder.allowClassicFlow;
            this.allowUnauthenticatedIdentities = builder.allowUnauthenticatedIdentities;
            this.cognitoIdentityProviders = builder.cognitoIdentityProviders;
            this.developerProviderName = builder.developerProviderName;
            this.id = builder.id;
            this.openidConnectProviderArns = builder.openidConnectProviderArns;
            this.samlProviderArns = builder.samlProviderArns;
            this.supportedLoginProviders = builder.supportedLoginProviders;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getIdentityPoolName() {
            return this.identityPoolName;
        }

        @Override
        public final java.lang.Object getAllowClassicFlow() {
            return this.allowClassicFlow;
        }

        @Override
        public final java.lang.Object getAllowUnauthenticatedIdentities() {
            return this.allowUnauthenticatedIdentities;
        }

        @Override
        public final java.lang.Object getCognitoIdentityProviders() {
            return this.cognitoIdentityProviders;
        }

        @Override
        public final java.lang.String getDeveloperProviderName() {
            return this.developerProviderName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getOpenidConnectProviderArns() {
            return this.openidConnectProviderArns;
        }

        @Override
        public final java.util.List<java.lang.String> getSamlProviderArns() {
            return this.samlProviderArns;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getSupportedLoginProviders() {
            return this.supportedLoginProviders;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("identityPoolName", om.valueToTree(this.getIdentityPoolName()));
            if (this.getAllowClassicFlow() != null) {
                data.set("allowClassicFlow", om.valueToTree(this.getAllowClassicFlow()));
            }
            if (this.getAllowUnauthenticatedIdentities() != null) {
                data.set("allowUnauthenticatedIdentities", om.valueToTree(this.getAllowUnauthenticatedIdentities()));
            }
            if (this.getCognitoIdentityProviders() != null) {
                data.set("cognitoIdentityProviders", om.valueToTree(this.getCognitoIdentityProviders()));
            }
            if (this.getDeveloperProviderName() != null) {
                data.set("developerProviderName", om.valueToTree(this.getDeveloperProviderName()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOpenidConnectProviderArns() != null) {
                data.set("openidConnectProviderArns", om.valueToTree(this.getOpenidConnectProviderArns()));
            }
            if (this.getSamlProviderArns() != null) {
                data.set("samlProviderArns", om.valueToTree(this.getSamlProviderArns()));
            }
            if (this.getSupportedLoginProviders() != null) {
                data.set("supportedLoginProviders", om.valueToTree(this.getSupportedLoginProviders()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.cognitoIdentityPool.CognitoIdentityPoolConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoIdentityPoolConfig.Jsii$Proxy that = (CognitoIdentityPoolConfig.Jsii$Proxy) o;

            if (!identityPoolName.equals(that.identityPoolName)) return false;
            if (this.allowClassicFlow != null ? !this.allowClassicFlow.equals(that.allowClassicFlow) : that.allowClassicFlow != null) return false;
            if (this.allowUnauthenticatedIdentities != null ? !this.allowUnauthenticatedIdentities.equals(that.allowUnauthenticatedIdentities) : that.allowUnauthenticatedIdentities != null) return false;
            if (this.cognitoIdentityProviders != null ? !this.cognitoIdentityProviders.equals(that.cognitoIdentityProviders) : that.cognitoIdentityProviders != null) return false;
            if (this.developerProviderName != null ? !this.developerProviderName.equals(that.developerProviderName) : that.developerProviderName != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.openidConnectProviderArns != null ? !this.openidConnectProviderArns.equals(that.openidConnectProviderArns) : that.openidConnectProviderArns != null) return false;
            if (this.samlProviderArns != null ? !this.samlProviderArns.equals(that.samlProviderArns) : that.samlProviderArns != null) return false;
            if (this.supportedLoginProviders != null ? !this.supportedLoginProviders.equals(that.supportedLoginProviders) : that.supportedLoginProviders != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.identityPoolName.hashCode();
            result = 31 * result + (this.allowClassicFlow != null ? this.allowClassicFlow.hashCode() : 0);
            result = 31 * result + (this.allowUnauthenticatedIdentities != null ? this.allowUnauthenticatedIdentities.hashCode() : 0);
            result = 31 * result + (this.cognitoIdentityProviders != null ? this.cognitoIdentityProviders.hashCode() : 0);
            result = 31 * result + (this.developerProviderName != null ? this.developerProviderName.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.openidConnectProviderArns != null ? this.openidConnectProviderArns.hashCode() : 0);
            result = 31 * result + (this.samlProviderArns != null ? this.samlProviderArns.hashCode() : 0);
            result = 31 * result + (this.supportedLoginProviders != null ? this.supportedLoginProviders.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
