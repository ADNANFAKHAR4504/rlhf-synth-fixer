package imports.aws.api_gateway_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.948Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayIntegration.ApiGatewayIntegrationConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayIntegrationConfig.Jsii$Proxy.class)
public interface ApiGatewayIntegrationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#http_method ApiGatewayIntegration#http_method}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHttpMethod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#resource_id ApiGatewayIntegration#resource_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#rest_api_id ApiGatewayIntegration#rest_api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRestApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#type ApiGatewayIntegration#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#cache_key_parameters ApiGatewayIntegration#cache_key_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCacheKeyParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#cache_namespace ApiGatewayIntegration#cache_namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCacheNamespace() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#connection_id ApiGatewayIntegration#connection_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#connection_type ApiGatewayIntegration#connection_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#content_handling ApiGatewayIntegration#content_handling}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentHandling() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#credentials ApiGatewayIntegration#credentials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#id ApiGatewayIntegration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#integration_http_method ApiGatewayIntegration#integration_http_method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIntegrationHttpMethod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#passthrough_behavior ApiGatewayIntegration#passthrough_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassthroughBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#request_parameters ApiGatewayIntegration#request_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#request_templates ApiGatewayIntegration#request_templates}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestTemplates() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#timeout_milliseconds ApiGatewayIntegration#timeout_milliseconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutMilliseconds() {
        return null;
    }

    /**
     * tls_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#tls_config ApiGatewayIntegration#tls_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig getTlsConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#uri ApiGatewayIntegration#uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayIntegrationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayIntegrationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayIntegrationConfig> {
        java.lang.String httpMethod;
        java.lang.String resourceId;
        java.lang.String restApiId;
        java.lang.String type;
        java.util.List<java.lang.String> cacheKeyParameters;
        java.lang.String cacheNamespace;
        java.lang.String connectionId;
        java.lang.String connectionType;
        java.lang.String contentHandling;
        java.lang.String credentials;
        java.lang.String id;
        java.lang.String integrationHttpMethod;
        java.lang.String passthroughBehavior;
        java.util.Map<java.lang.String, java.lang.String> requestParameters;
        java.util.Map<java.lang.String, java.lang.String> requestTemplates;
        java.lang.Number timeoutMilliseconds;
        imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig tlsConfig;
        java.lang.String uri;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getHttpMethod}
         * @param httpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#http_method ApiGatewayIntegration#http_method}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpMethod(java.lang.String httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getResourceId}
         * @param resourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#resource_id ApiGatewayIntegration#resource_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceId(java.lang.String resourceId) {
            this.resourceId = resourceId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getRestApiId}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#rest_api_id ApiGatewayIntegration#rest_api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder restApiId(java.lang.String restApiId) {
            this.restApiId = restApiId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#type ApiGatewayIntegration#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getCacheKeyParameters}
         * @param cacheKeyParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#cache_key_parameters ApiGatewayIntegration#cache_key_parameters}.
         * @return {@code this}
         */
        public Builder cacheKeyParameters(java.util.List<java.lang.String> cacheKeyParameters) {
            this.cacheKeyParameters = cacheKeyParameters;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getCacheNamespace}
         * @param cacheNamespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#cache_namespace ApiGatewayIntegration#cache_namespace}.
         * @return {@code this}
         */
        public Builder cacheNamespace(java.lang.String cacheNamespace) {
            this.cacheNamespace = cacheNamespace;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getConnectionId}
         * @param connectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#connection_id ApiGatewayIntegration#connection_id}.
         * @return {@code this}
         */
        public Builder connectionId(java.lang.String connectionId) {
            this.connectionId = connectionId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getConnectionType}
         * @param connectionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#connection_type ApiGatewayIntegration#connection_type}.
         * @return {@code this}
         */
        public Builder connectionType(java.lang.String connectionType) {
            this.connectionType = connectionType;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getContentHandling}
         * @param contentHandling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#content_handling ApiGatewayIntegration#content_handling}.
         * @return {@code this}
         */
        public Builder contentHandling(java.lang.String contentHandling) {
            this.contentHandling = contentHandling;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getCredentials}
         * @param credentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#credentials ApiGatewayIntegration#credentials}.
         * @return {@code this}
         */
        public Builder credentials(java.lang.String credentials) {
            this.credentials = credentials;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#id ApiGatewayIntegration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getIntegrationHttpMethod}
         * @param integrationHttpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#integration_http_method ApiGatewayIntegration#integration_http_method}.
         * @return {@code this}
         */
        public Builder integrationHttpMethod(java.lang.String integrationHttpMethod) {
            this.integrationHttpMethod = integrationHttpMethod;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getPassthroughBehavior}
         * @param passthroughBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#passthrough_behavior ApiGatewayIntegration#passthrough_behavior}.
         * @return {@code this}
         */
        public Builder passthroughBehavior(java.lang.String passthroughBehavior) {
            this.passthroughBehavior = passthroughBehavior;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getRequestParameters}
         * @param requestParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#request_parameters ApiGatewayIntegration#request_parameters}.
         * @return {@code this}
         */
        public Builder requestParameters(java.util.Map<java.lang.String, java.lang.String> requestParameters) {
            this.requestParameters = requestParameters;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getRequestTemplates}
         * @param requestTemplates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#request_templates ApiGatewayIntegration#request_templates}.
         * @return {@code this}
         */
        public Builder requestTemplates(java.util.Map<java.lang.String, java.lang.String> requestTemplates) {
            this.requestTemplates = requestTemplates;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getTimeoutMilliseconds}
         * @param timeoutMilliseconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#timeout_milliseconds ApiGatewayIntegration#timeout_milliseconds}.
         * @return {@code this}
         */
        public Builder timeoutMilliseconds(java.lang.Number timeoutMilliseconds) {
            this.timeoutMilliseconds = timeoutMilliseconds;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getTlsConfig}
         * @param tlsConfig tls_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#tls_config ApiGatewayIntegration#tls_config}
         * @return {@code this}
         */
        public Builder tlsConfig(imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig tlsConfig) {
            this.tlsConfig = tlsConfig;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getUri}
         * @param uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#uri ApiGatewayIntegration#uri}.
         * @return {@code this}
         */
        public Builder uri(java.lang.String uri) {
            this.uri = uri;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayIntegrationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayIntegrationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayIntegrationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayIntegrationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayIntegrationConfig {
        private final java.lang.String httpMethod;
        private final java.lang.String resourceId;
        private final java.lang.String restApiId;
        private final java.lang.String type;
        private final java.util.List<java.lang.String> cacheKeyParameters;
        private final java.lang.String cacheNamespace;
        private final java.lang.String connectionId;
        private final java.lang.String connectionType;
        private final java.lang.String contentHandling;
        private final java.lang.String credentials;
        private final java.lang.String id;
        private final java.lang.String integrationHttpMethod;
        private final java.lang.String passthroughBehavior;
        private final java.util.Map<java.lang.String, java.lang.String> requestParameters;
        private final java.util.Map<java.lang.String, java.lang.String> requestTemplates;
        private final java.lang.Number timeoutMilliseconds;
        private final imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig tlsConfig;
        private final java.lang.String uri;
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
            this.httpMethod = software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceId = software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restApiId = software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cacheKeyParameters = software.amazon.jsii.Kernel.get(this, "cacheKeyParameters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cacheNamespace = software.amazon.jsii.Kernel.get(this, "cacheNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionId = software.amazon.jsii.Kernel.get(this, "connectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionType = software.amazon.jsii.Kernel.get(this, "connectionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentHandling = software.amazon.jsii.Kernel.get(this, "contentHandling", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentials = software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.integrationHttpMethod = software.amazon.jsii.Kernel.get(this, "integrationHttpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.passthroughBehavior = software.amazon.jsii.Kernel.get(this, "passthroughBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requestParameters = software.amazon.jsii.Kernel.get(this, "requestParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.requestTemplates = software.amazon.jsii.Kernel.get(this, "requestTemplates", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeoutMilliseconds = software.amazon.jsii.Kernel.get(this, "timeoutMilliseconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tlsConfig = software.amazon.jsii.Kernel.get(this, "tlsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig.class));
            this.uri = software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.httpMethod = java.util.Objects.requireNonNull(builder.httpMethod, "httpMethod is required");
            this.resourceId = java.util.Objects.requireNonNull(builder.resourceId, "resourceId is required");
            this.restApiId = java.util.Objects.requireNonNull(builder.restApiId, "restApiId is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.cacheKeyParameters = builder.cacheKeyParameters;
            this.cacheNamespace = builder.cacheNamespace;
            this.connectionId = builder.connectionId;
            this.connectionType = builder.connectionType;
            this.contentHandling = builder.contentHandling;
            this.credentials = builder.credentials;
            this.id = builder.id;
            this.integrationHttpMethod = builder.integrationHttpMethod;
            this.passthroughBehavior = builder.passthroughBehavior;
            this.requestParameters = builder.requestParameters;
            this.requestTemplates = builder.requestTemplates;
            this.timeoutMilliseconds = builder.timeoutMilliseconds;
            this.tlsConfig = builder.tlsConfig;
            this.uri = builder.uri;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getHttpMethod() {
            return this.httpMethod;
        }

        @Override
        public final java.lang.String getResourceId() {
            return this.resourceId;
        }

        @Override
        public final java.lang.String getRestApiId() {
            return this.restApiId;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.util.List<java.lang.String> getCacheKeyParameters() {
            return this.cacheKeyParameters;
        }

        @Override
        public final java.lang.String getCacheNamespace() {
            return this.cacheNamespace;
        }

        @Override
        public final java.lang.String getConnectionId() {
            return this.connectionId;
        }

        @Override
        public final java.lang.String getConnectionType() {
            return this.connectionType;
        }

        @Override
        public final java.lang.String getContentHandling() {
            return this.contentHandling;
        }

        @Override
        public final java.lang.String getCredentials() {
            return this.credentials;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIntegrationHttpMethod() {
            return this.integrationHttpMethod;
        }

        @Override
        public final java.lang.String getPassthroughBehavior() {
            return this.passthroughBehavior;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRequestParameters() {
            return this.requestParameters;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRequestTemplates() {
            return this.requestTemplates;
        }

        @Override
        public final java.lang.Number getTimeoutMilliseconds() {
            return this.timeoutMilliseconds;
        }

        @Override
        public final imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig getTlsConfig() {
            return this.tlsConfig;
        }

        @Override
        public final java.lang.String getUri() {
            return this.uri;
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

            data.set("httpMethod", om.valueToTree(this.getHttpMethod()));
            data.set("resourceId", om.valueToTree(this.getResourceId()));
            data.set("restApiId", om.valueToTree(this.getRestApiId()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getCacheKeyParameters() != null) {
                data.set("cacheKeyParameters", om.valueToTree(this.getCacheKeyParameters()));
            }
            if (this.getCacheNamespace() != null) {
                data.set("cacheNamespace", om.valueToTree(this.getCacheNamespace()));
            }
            if (this.getConnectionId() != null) {
                data.set("connectionId", om.valueToTree(this.getConnectionId()));
            }
            if (this.getConnectionType() != null) {
                data.set("connectionType", om.valueToTree(this.getConnectionType()));
            }
            if (this.getContentHandling() != null) {
                data.set("contentHandling", om.valueToTree(this.getContentHandling()));
            }
            if (this.getCredentials() != null) {
                data.set("credentials", om.valueToTree(this.getCredentials()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIntegrationHttpMethod() != null) {
                data.set("integrationHttpMethod", om.valueToTree(this.getIntegrationHttpMethod()));
            }
            if (this.getPassthroughBehavior() != null) {
                data.set("passthroughBehavior", om.valueToTree(this.getPassthroughBehavior()));
            }
            if (this.getRequestParameters() != null) {
                data.set("requestParameters", om.valueToTree(this.getRequestParameters()));
            }
            if (this.getRequestTemplates() != null) {
                data.set("requestTemplates", om.valueToTree(this.getRequestTemplates()));
            }
            if (this.getTimeoutMilliseconds() != null) {
                data.set("timeoutMilliseconds", om.valueToTree(this.getTimeoutMilliseconds()));
            }
            if (this.getTlsConfig() != null) {
                data.set("tlsConfig", om.valueToTree(this.getTlsConfig()));
            }
            if (this.getUri() != null) {
                data.set("uri", om.valueToTree(this.getUri()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayIntegration.ApiGatewayIntegrationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayIntegrationConfig.Jsii$Proxy that = (ApiGatewayIntegrationConfig.Jsii$Proxy) o;

            if (!httpMethod.equals(that.httpMethod)) return false;
            if (!resourceId.equals(that.resourceId)) return false;
            if (!restApiId.equals(that.restApiId)) return false;
            if (!type.equals(that.type)) return false;
            if (this.cacheKeyParameters != null ? !this.cacheKeyParameters.equals(that.cacheKeyParameters) : that.cacheKeyParameters != null) return false;
            if (this.cacheNamespace != null ? !this.cacheNamespace.equals(that.cacheNamespace) : that.cacheNamespace != null) return false;
            if (this.connectionId != null ? !this.connectionId.equals(that.connectionId) : that.connectionId != null) return false;
            if (this.connectionType != null ? !this.connectionType.equals(that.connectionType) : that.connectionType != null) return false;
            if (this.contentHandling != null ? !this.contentHandling.equals(that.contentHandling) : that.contentHandling != null) return false;
            if (this.credentials != null ? !this.credentials.equals(that.credentials) : that.credentials != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.integrationHttpMethod != null ? !this.integrationHttpMethod.equals(that.integrationHttpMethod) : that.integrationHttpMethod != null) return false;
            if (this.passthroughBehavior != null ? !this.passthroughBehavior.equals(that.passthroughBehavior) : that.passthroughBehavior != null) return false;
            if (this.requestParameters != null ? !this.requestParameters.equals(that.requestParameters) : that.requestParameters != null) return false;
            if (this.requestTemplates != null ? !this.requestTemplates.equals(that.requestTemplates) : that.requestTemplates != null) return false;
            if (this.timeoutMilliseconds != null ? !this.timeoutMilliseconds.equals(that.timeoutMilliseconds) : that.timeoutMilliseconds != null) return false;
            if (this.tlsConfig != null ? !this.tlsConfig.equals(that.tlsConfig) : that.tlsConfig != null) return false;
            if (this.uri != null ? !this.uri.equals(that.uri) : that.uri != null) return false;
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
            int result = this.httpMethod.hashCode();
            result = 31 * result + (this.resourceId.hashCode());
            result = 31 * result + (this.restApiId.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.cacheKeyParameters != null ? this.cacheKeyParameters.hashCode() : 0);
            result = 31 * result + (this.cacheNamespace != null ? this.cacheNamespace.hashCode() : 0);
            result = 31 * result + (this.connectionId != null ? this.connectionId.hashCode() : 0);
            result = 31 * result + (this.connectionType != null ? this.connectionType.hashCode() : 0);
            result = 31 * result + (this.contentHandling != null ? this.contentHandling.hashCode() : 0);
            result = 31 * result + (this.credentials != null ? this.credentials.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.integrationHttpMethod != null ? this.integrationHttpMethod.hashCode() : 0);
            result = 31 * result + (this.passthroughBehavior != null ? this.passthroughBehavior.hashCode() : 0);
            result = 31 * result + (this.requestParameters != null ? this.requestParameters.hashCode() : 0);
            result = 31 * result + (this.requestTemplates != null ? this.requestTemplates.hashCode() : 0);
            result = 31 * result + (this.timeoutMilliseconds != null ? this.timeoutMilliseconds.hashCode() : 0);
            result = 31 * result + (this.tlsConfig != null ? this.tlsConfig.hashCode() : 0);
            result = 31 * result + (this.uri != null ? this.uri.hashCode() : 0);
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
