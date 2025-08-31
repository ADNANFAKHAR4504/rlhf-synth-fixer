package imports.aws.apigatewayv2_authorizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.963Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Authorizer.Apigatewayv2AuthorizerConfig")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2AuthorizerConfig.Jsii$Proxy.class)
public interface Apigatewayv2AuthorizerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#api_id Apigatewayv2Authorizer#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_type Apigatewayv2Authorizer#authorizer_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthorizerType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#name Apigatewayv2Authorizer#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_credentials_arn Apigatewayv2Authorizer#authorizer_credentials_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerCredentialsArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_payload_format_version Apigatewayv2Authorizer#authorizer_payload_format_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerPayloadFormatVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_result_ttl_in_seconds Apigatewayv2Authorizer#authorizer_result_ttl_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAuthorizerResultTtlInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_uri Apigatewayv2Authorizer#authorizer_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerUri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#enable_simple_responses Apigatewayv2Authorizer#enable_simple_responses}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableSimpleResponses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#id Apigatewayv2Authorizer#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#identity_sources Apigatewayv2Authorizer#identity_sources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIdentitySources() {
        return null;
    }

    /**
     * jwt_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#jwt_configuration Apigatewayv2Authorizer#jwt_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerJwtConfiguration getJwtConfiguration() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#timeouts Apigatewayv2Authorizer#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2AuthorizerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2AuthorizerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2AuthorizerConfig> {
        java.lang.String apiId;
        java.lang.String authorizerType;
        java.lang.String name;
        java.lang.String authorizerCredentialsArn;
        java.lang.String authorizerPayloadFormatVersion;
        java.lang.Number authorizerResultTtlInSeconds;
        java.lang.String authorizerUri;
        java.lang.Object enableSimpleResponses;
        java.lang.String id;
        java.util.List<java.lang.String> identitySources;
        imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerJwtConfiguration jwtConfiguration;
        imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#api_id Apigatewayv2Authorizer#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getAuthorizerType}
         * @param authorizerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_type Apigatewayv2Authorizer#authorizer_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder authorizerType(java.lang.String authorizerType) {
            this.authorizerType = authorizerType;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#name Apigatewayv2Authorizer#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getAuthorizerCredentialsArn}
         * @param authorizerCredentialsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_credentials_arn Apigatewayv2Authorizer#authorizer_credentials_arn}.
         * @return {@code this}
         */
        public Builder authorizerCredentialsArn(java.lang.String authorizerCredentialsArn) {
            this.authorizerCredentialsArn = authorizerCredentialsArn;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getAuthorizerPayloadFormatVersion}
         * @param authorizerPayloadFormatVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_payload_format_version Apigatewayv2Authorizer#authorizer_payload_format_version}.
         * @return {@code this}
         */
        public Builder authorizerPayloadFormatVersion(java.lang.String authorizerPayloadFormatVersion) {
            this.authorizerPayloadFormatVersion = authorizerPayloadFormatVersion;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getAuthorizerResultTtlInSeconds}
         * @param authorizerResultTtlInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_result_ttl_in_seconds Apigatewayv2Authorizer#authorizer_result_ttl_in_seconds}.
         * @return {@code this}
         */
        public Builder authorizerResultTtlInSeconds(java.lang.Number authorizerResultTtlInSeconds) {
            this.authorizerResultTtlInSeconds = authorizerResultTtlInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getAuthorizerUri}
         * @param authorizerUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#authorizer_uri Apigatewayv2Authorizer#authorizer_uri}.
         * @return {@code this}
         */
        public Builder authorizerUri(java.lang.String authorizerUri) {
            this.authorizerUri = authorizerUri;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getEnableSimpleResponses}
         * @param enableSimpleResponses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#enable_simple_responses Apigatewayv2Authorizer#enable_simple_responses}.
         * @return {@code this}
         */
        public Builder enableSimpleResponses(java.lang.Boolean enableSimpleResponses) {
            this.enableSimpleResponses = enableSimpleResponses;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getEnableSimpleResponses}
         * @param enableSimpleResponses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#enable_simple_responses Apigatewayv2Authorizer#enable_simple_responses}.
         * @return {@code this}
         */
        public Builder enableSimpleResponses(com.hashicorp.cdktf.IResolvable enableSimpleResponses) {
            this.enableSimpleResponses = enableSimpleResponses;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#id Apigatewayv2Authorizer#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getIdentitySources}
         * @param identitySources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#identity_sources Apigatewayv2Authorizer#identity_sources}.
         * @return {@code this}
         */
        public Builder identitySources(java.util.List<java.lang.String> identitySources) {
            this.identitySources = identitySources;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getJwtConfiguration}
         * @param jwtConfiguration jwt_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#jwt_configuration Apigatewayv2Authorizer#jwt_configuration}
         * @return {@code this}
         */
        public Builder jwtConfiguration(imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerJwtConfiguration jwtConfiguration) {
            this.jwtConfiguration = jwtConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_authorizer#timeouts Apigatewayv2Authorizer#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getDependsOn}
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
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2AuthorizerConfig#getProvisioners}
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
         * @return a new instance of {@link Apigatewayv2AuthorizerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2AuthorizerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2AuthorizerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2AuthorizerConfig {
        private final java.lang.String apiId;
        private final java.lang.String authorizerType;
        private final java.lang.String name;
        private final java.lang.String authorizerCredentialsArn;
        private final java.lang.String authorizerPayloadFormatVersion;
        private final java.lang.Number authorizerResultTtlInSeconds;
        private final java.lang.String authorizerUri;
        private final java.lang.Object enableSimpleResponses;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> identitySources;
        private final imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerJwtConfiguration jwtConfiguration;
        private final imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerTimeouts timeouts;
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
            this.apiId = software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerType = software.amazon.jsii.Kernel.get(this, "authorizerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerCredentialsArn = software.amazon.jsii.Kernel.get(this, "authorizerCredentialsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerPayloadFormatVersion = software.amazon.jsii.Kernel.get(this, "authorizerPayloadFormatVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerResultTtlInSeconds = software.amazon.jsii.Kernel.get(this, "authorizerResultTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.authorizerUri = software.amazon.jsii.Kernel.get(this, "authorizerUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableSimpleResponses = software.amazon.jsii.Kernel.get(this, "enableSimpleResponses", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identitySources = software.amazon.jsii.Kernel.get(this, "identitySources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.jwtConfiguration = software.amazon.jsii.Kernel.get(this, "jwtConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerJwtConfiguration.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerTimeouts.class));
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
            this.apiId = java.util.Objects.requireNonNull(builder.apiId, "apiId is required");
            this.authorizerType = java.util.Objects.requireNonNull(builder.authorizerType, "authorizerType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.authorizerCredentialsArn = builder.authorizerCredentialsArn;
            this.authorizerPayloadFormatVersion = builder.authorizerPayloadFormatVersion;
            this.authorizerResultTtlInSeconds = builder.authorizerResultTtlInSeconds;
            this.authorizerUri = builder.authorizerUri;
            this.enableSimpleResponses = builder.enableSimpleResponses;
            this.id = builder.id;
            this.identitySources = builder.identitySources;
            this.jwtConfiguration = builder.jwtConfiguration;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getApiId() {
            return this.apiId;
        }

        @Override
        public final java.lang.String getAuthorizerType() {
            return this.authorizerType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getAuthorizerCredentialsArn() {
            return this.authorizerCredentialsArn;
        }

        @Override
        public final java.lang.String getAuthorizerPayloadFormatVersion() {
            return this.authorizerPayloadFormatVersion;
        }

        @Override
        public final java.lang.Number getAuthorizerResultTtlInSeconds() {
            return this.authorizerResultTtlInSeconds;
        }

        @Override
        public final java.lang.String getAuthorizerUri() {
            return this.authorizerUri;
        }

        @Override
        public final java.lang.Object getEnableSimpleResponses() {
            return this.enableSimpleResponses;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getIdentitySources() {
            return this.identitySources;
        }

        @Override
        public final imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerJwtConfiguration getJwtConfiguration() {
            return this.jwtConfiguration;
        }

        @Override
        public final imports.aws.apigatewayv2_authorizer.Apigatewayv2AuthorizerTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("apiId", om.valueToTree(this.getApiId()));
            data.set("authorizerType", om.valueToTree(this.getAuthorizerType()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAuthorizerCredentialsArn() != null) {
                data.set("authorizerCredentialsArn", om.valueToTree(this.getAuthorizerCredentialsArn()));
            }
            if (this.getAuthorizerPayloadFormatVersion() != null) {
                data.set("authorizerPayloadFormatVersion", om.valueToTree(this.getAuthorizerPayloadFormatVersion()));
            }
            if (this.getAuthorizerResultTtlInSeconds() != null) {
                data.set("authorizerResultTtlInSeconds", om.valueToTree(this.getAuthorizerResultTtlInSeconds()));
            }
            if (this.getAuthorizerUri() != null) {
                data.set("authorizerUri", om.valueToTree(this.getAuthorizerUri()));
            }
            if (this.getEnableSimpleResponses() != null) {
                data.set("enableSimpleResponses", om.valueToTree(this.getEnableSimpleResponses()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdentitySources() != null) {
                data.set("identitySources", om.valueToTree(this.getIdentitySources()));
            }
            if (this.getJwtConfiguration() != null) {
                data.set("jwtConfiguration", om.valueToTree(this.getJwtConfiguration()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Authorizer.Apigatewayv2AuthorizerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2AuthorizerConfig.Jsii$Proxy that = (Apigatewayv2AuthorizerConfig.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!authorizerType.equals(that.authorizerType)) return false;
            if (!name.equals(that.name)) return false;
            if (this.authorizerCredentialsArn != null ? !this.authorizerCredentialsArn.equals(that.authorizerCredentialsArn) : that.authorizerCredentialsArn != null) return false;
            if (this.authorizerPayloadFormatVersion != null ? !this.authorizerPayloadFormatVersion.equals(that.authorizerPayloadFormatVersion) : that.authorizerPayloadFormatVersion != null) return false;
            if (this.authorizerResultTtlInSeconds != null ? !this.authorizerResultTtlInSeconds.equals(that.authorizerResultTtlInSeconds) : that.authorizerResultTtlInSeconds != null) return false;
            if (this.authorizerUri != null ? !this.authorizerUri.equals(that.authorizerUri) : that.authorizerUri != null) return false;
            if (this.enableSimpleResponses != null ? !this.enableSimpleResponses.equals(that.enableSimpleResponses) : that.enableSimpleResponses != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.identitySources != null ? !this.identitySources.equals(that.identitySources) : that.identitySources != null) return false;
            if (this.jwtConfiguration != null ? !this.jwtConfiguration.equals(that.jwtConfiguration) : that.jwtConfiguration != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.apiId.hashCode();
            result = 31 * result + (this.authorizerType.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.authorizerCredentialsArn != null ? this.authorizerCredentialsArn.hashCode() : 0);
            result = 31 * result + (this.authorizerPayloadFormatVersion != null ? this.authorizerPayloadFormatVersion.hashCode() : 0);
            result = 31 * result + (this.authorizerResultTtlInSeconds != null ? this.authorizerResultTtlInSeconds.hashCode() : 0);
            result = 31 * result + (this.authorizerUri != null ? this.authorizerUri.hashCode() : 0);
            result = 31 * result + (this.enableSimpleResponses != null ? this.enableSimpleResponses.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.identitySources != null ? this.identitySources.hashCode() : 0);
            result = 31 * result + (this.jwtConfiguration != null ? this.jwtConfiguration.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
