package imports.aws.api_gateway_rest_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.957Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayRestApi.ApiGatewayRestApiConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayRestApiConfig.Jsii$Proxy.class)
public interface ApiGatewayRestApiConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#name ApiGatewayRestApi#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#api_key_source ApiGatewayRestApi#api_key_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApiKeySource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#binary_media_types ApiGatewayRestApi#binary_media_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getBinaryMediaTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#body ApiGatewayRestApi#body}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBody() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#description ApiGatewayRestApi#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#disable_execute_api_endpoint ApiGatewayRestApi#disable_execute_api_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableExecuteApiEndpoint() {
        return null;
    }

    /**
     * endpoint_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#endpoint_configuration ApiGatewayRestApi#endpoint_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration getEndpointConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#fail_on_warnings ApiGatewayRestApi#fail_on_warnings}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailOnWarnings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#id ApiGatewayRestApi#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#minimum_compression_size ApiGatewayRestApi#minimum_compression_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMinimumCompressionSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#parameters ApiGatewayRestApi#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#policy ApiGatewayRestApi#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#put_rest_api_mode ApiGatewayRestApi#put_rest_api_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPutRestApiMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#tags ApiGatewayRestApi#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#tags_all ApiGatewayRestApi#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayRestApiConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayRestApiConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayRestApiConfig> {
        java.lang.String name;
        java.lang.String apiKeySource;
        java.util.List<java.lang.String> binaryMediaTypes;
        java.lang.String body;
        java.lang.String description;
        java.lang.Object disableExecuteApiEndpoint;
        imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration endpointConfiguration;
        java.lang.Object failOnWarnings;
        java.lang.String id;
        java.lang.String minimumCompressionSize;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.lang.String policy;
        java.lang.String putRestApiMode;
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
         * Sets the value of {@link ApiGatewayRestApiConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#name ApiGatewayRestApi#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getApiKeySource}
         * @param apiKeySource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#api_key_source ApiGatewayRestApi#api_key_source}.
         * @return {@code this}
         */
        public Builder apiKeySource(java.lang.String apiKeySource) {
            this.apiKeySource = apiKeySource;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getBinaryMediaTypes}
         * @param binaryMediaTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#binary_media_types ApiGatewayRestApi#binary_media_types}.
         * @return {@code this}
         */
        public Builder binaryMediaTypes(java.util.List<java.lang.String> binaryMediaTypes) {
            this.binaryMediaTypes = binaryMediaTypes;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getBody}
         * @param body Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#body ApiGatewayRestApi#body}.
         * @return {@code this}
         */
        public Builder body(java.lang.String body) {
            this.body = body;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#description ApiGatewayRestApi#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getDisableExecuteApiEndpoint}
         * @param disableExecuteApiEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#disable_execute_api_endpoint ApiGatewayRestApi#disable_execute_api_endpoint}.
         * @return {@code this}
         */
        public Builder disableExecuteApiEndpoint(java.lang.Boolean disableExecuteApiEndpoint) {
            this.disableExecuteApiEndpoint = disableExecuteApiEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getDisableExecuteApiEndpoint}
         * @param disableExecuteApiEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#disable_execute_api_endpoint ApiGatewayRestApi#disable_execute_api_endpoint}.
         * @return {@code this}
         */
        public Builder disableExecuteApiEndpoint(com.hashicorp.cdktf.IResolvable disableExecuteApiEndpoint) {
            this.disableExecuteApiEndpoint = disableExecuteApiEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getEndpointConfiguration}
         * @param endpointConfiguration endpoint_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#endpoint_configuration ApiGatewayRestApi#endpoint_configuration}
         * @return {@code this}
         */
        public Builder endpointConfiguration(imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration endpointConfiguration) {
            this.endpointConfiguration = endpointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getFailOnWarnings}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#fail_on_warnings ApiGatewayRestApi#fail_on_warnings}.
         * @return {@code this}
         */
        public Builder failOnWarnings(java.lang.Boolean failOnWarnings) {
            this.failOnWarnings = failOnWarnings;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getFailOnWarnings}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#fail_on_warnings ApiGatewayRestApi#fail_on_warnings}.
         * @return {@code this}
         */
        public Builder failOnWarnings(com.hashicorp.cdktf.IResolvable failOnWarnings) {
            this.failOnWarnings = failOnWarnings;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#id ApiGatewayRestApi#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getMinimumCompressionSize}
         * @param minimumCompressionSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#minimum_compression_size ApiGatewayRestApi#minimum_compression_size}.
         * @return {@code this}
         */
        public Builder minimumCompressionSize(java.lang.String minimumCompressionSize) {
            this.minimumCompressionSize = minimumCompressionSize;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#parameters ApiGatewayRestApi#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#policy ApiGatewayRestApi#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getPutRestApiMode}
         * @param putRestApiMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#put_rest_api_mode ApiGatewayRestApi#put_rest_api_mode}.
         * @return {@code this}
         */
        public Builder putRestApiMode(java.lang.String putRestApiMode) {
            this.putRestApiMode = putRestApiMode;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#tags ApiGatewayRestApi#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#tags_all ApiGatewayRestApi#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayRestApiConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayRestApiConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayRestApiConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayRestApiConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayRestApiConfig {
        private final java.lang.String name;
        private final java.lang.String apiKeySource;
        private final java.util.List<java.lang.String> binaryMediaTypes;
        private final java.lang.String body;
        private final java.lang.String description;
        private final java.lang.Object disableExecuteApiEndpoint;
        private final imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration endpointConfiguration;
        private final java.lang.Object failOnWarnings;
        private final java.lang.String id;
        private final java.lang.String minimumCompressionSize;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.lang.String policy;
        private final java.lang.String putRestApiMode;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.apiKeySource = software.amazon.jsii.Kernel.get(this, "apiKeySource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.binaryMediaTypes = software.amazon.jsii.Kernel.get(this, "binaryMediaTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.body = software.amazon.jsii.Kernel.get(this, "body", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disableExecuteApiEndpoint = software.amazon.jsii.Kernel.get(this, "disableExecuteApiEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.endpointConfiguration = software.amazon.jsii.Kernel.get(this, "endpointConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration.class));
            this.failOnWarnings = software.amazon.jsii.Kernel.get(this, "failOnWarnings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minimumCompressionSize = software.amazon.jsii.Kernel.get(this, "minimumCompressionSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.putRestApiMode = software.amazon.jsii.Kernel.get(this, "putRestApiMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.apiKeySource = builder.apiKeySource;
            this.binaryMediaTypes = builder.binaryMediaTypes;
            this.body = builder.body;
            this.description = builder.description;
            this.disableExecuteApiEndpoint = builder.disableExecuteApiEndpoint;
            this.endpointConfiguration = builder.endpointConfiguration;
            this.failOnWarnings = builder.failOnWarnings;
            this.id = builder.id;
            this.minimumCompressionSize = builder.minimumCompressionSize;
            this.parameters = builder.parameters;
            this.policy = builder.policy;
            this.putRestApiMode = builder.putRestApiMode;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getApiKeySource() {
            return this.apiKeySource;
        }

        @Override
        public final java.util.List<java.lang.String> getBinaryMediaTypes() {
            return this.binaryMediaTypes;
        }

        @Override
        public final java.lang.String getBody() {
            return this.body;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDisableExecuteApiEndpoint() {
            return this.disableExecuteApiEndpoint;
        }

        @Override
        public final imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration getEndpointConfiguration() {
            return this.endpointConfiguration;
        }

        @Override
        public final java.lang.Object getFailOnWarnings() {
            return this.failOnWarnings;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getMinimumCompressionSize() {
            return this.minimumCompressionSize;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final java.lang.String getPutRestApiMode() {
            return this.putRestApiMode;
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

            data.set("name", om.valueToTree(this.getName()));
            if (this.getApiKeySource() != null) {
                data.set("apiKeySource", om.valueToTree(this.getApiKeySource()));
            }
            if (this.getBinaryMediaTypes() != null) {
                data.set("binaryMediaTypes", om.valueToTree(this.getBinaryMediaTypes()));
            }
            if (this.getBody() != null) {
                data.set("body", om.valueToTree(this.getBody()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisableExecuteApiEndpoint() != null) {
                data.set("disableExecuteApiEndpoint", om.valueToTree(this.getDisableExecuteApiEndpoint()));
            }
            if (this.getEndpointConfiguration() != null) {
                data.set("endpointConfiguration", om.valueToTree(this.getEndpointConfiguration()));
            }
            if (this.getFailOnWarnings() != null) {
                data.set("failOnWarnings", om.valueToTree(this.getFailOnWarnings()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMinimumCompressionSize() != null) {
                data.set("minimumCompressionSize", om.valueToTree(this.getMinimumCompressionSize()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getPutRestApiMode() != null) {
                data.set("putRestApiMode", om.valueToTree(this.getPutRestApiMode()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayRestApi.ApiGatewayRestApiConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayRestApiConfig.Jsii$Proxy that = (ApiGatewayRestApiConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.apiKeySource != null ? !this.apiKeySource.equals(that.apiKeySource) : that.apiKeySource != null) return false;
            if (this.binaryMediaTypes != null ? !this.binaryMediaTypes.equals(that.binaryMediaTypes) : that.binaryMediaTypes != null) return false;
            if (this.body != null ? !this.body.equals(that.body) : that.body != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.disableExecuteApiEndpoint != null ? !this.disableExecuteApiEndpoint.equals(that.disableExecuteApiEndpoint) : that.disableExecuteApiEndpoint != null) return false;
            if (this.endpointConfiguration != null ? !this.endpointConfiguration.equals(that.endpointConfiguration) : that.endpointConfiguration != null) return false;
            if (this.failOnWarnings != null ? !this.failOnWarnings.equals(that.failOnWarnings) : that.failOnWarnings != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.minimumCompressionSize != null ? !this.minimumCompressionSize.equals(that.minimumCompressionSize) : that.minimumCompressionSize != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.putRestApiMode != null ? !this.putRestApiMode.equals(that.putRestApiMode) : that.putRestApiMode != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.apiKeySource != null ? this.apiKeySource.hashCode() : 0);
            result = 31 * result + (this.binaryMediaTypes != null ? this.binaryMediaTypes.hashCode() : 0);
            result = 31 * result + (this.body != null ? this.body.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.disableExecuteApiEndpoint != null ? this.disableExecuteApiEndpoint.hashCode() : 0);
            result = 31 * result + (this.endpointConfiguration != null ? this.endpointConfiguration.hashCode() : 0);
            result = 31 * result + (this.failOnWarnings != null ? this.failOnWarnings.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.minimumCompressionSize != null ? this.minimumCompressionSize.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.putRestApiMode != null ? this.putRestApiMode.hashCode() : 0);
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
