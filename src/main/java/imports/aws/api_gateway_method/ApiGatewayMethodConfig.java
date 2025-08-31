package imports.aws.api_gateway_method;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.949Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayMethod.ApiGatewayMethodConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayMethodConfig.Jsii$Proxy.class)
public interface ApiGatewayMethodConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#authorization ApiGatewayMethod#authorization}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthorization();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#http_method ApiGatewayMethod#http_method}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHttpMethod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#resource_id ApiGatewayMethod#resource_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#rest_api_id ApiGatewayMethod#rest_api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRestApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#api_key_required ApiGatewayMethod#api_key_required}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApiKeyRequired() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#authorization_scopes ApiGatewayMethod#authorization_scopes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAuthorizationScopes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#authorizer_id ApiGatewayMethod#authorizer_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#id ApiGatewayMethod#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#operation_name ApiGatewayMethod#operation_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOperationName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#request_models ApiGatewayMethod#request_models}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestModels() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#request_parameters ApiGatewayMethod#request_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.Object> getRequestParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#request_validator_id ApiGatewayMethod#request_validator_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRequestValidatorId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayMethodConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayMethodConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayMethodConfig> {
        java.lang.String authorization;
        java.lang.String httpMethod;
        java.lang.String resourceId;
        java.lang.String restApiId;
        java.lang.Object apiKeyRequired;
        java.util.List<java.lang.String> authorizationScopes;
        java.lang.String authorizerId;
        java.lang.String id;
        java.lang.String operationName;
        java.util.Map<java.lang.String, java.lang.String> requestModels;
        java.util.Map<java.lang.String, java.lang.Object> requestParameters;
        java.lang.String requestValidatorId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getAuthorization}
         * @param authorization Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#authorization ApiGatewayMethod#authorization}. This parameter is required.
         * @return {@code this}
         */
        public Builder authorization(java.lang.String authorization) {
            this.authorization = authorization;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getHttpMethod}
         * @param httpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#http_method ApiGatewayMethod#http_method}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpMethod(java.lang.String httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getResourceId}
         * @param resourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#resource_id ApiGatewayMethod#resource_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceId(java.lang.String resourceId) {
            this.resourceId = resourceId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getRestApiId}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#rest_api_id ApiGatewayMethod#rest_api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder restApiId(java.lang.String restApiId) {
            this.restApiId = restApiId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getApiKeyRequired}
         * @param apiKeyRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#api_key_required ApiGatewayMethod#api_key_required}.
         * @return {@code this}
         */
        public Builder apiKeyRequired(java.lang.Boolean apiKeyRequired) {
            this.apiKeyRequired = apiKeyRequired;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getApiKeyRequired}
         * @param apiKeyRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#api_key_required ApiGatewayMethod#api_key_required}.
         * @return {@code this}
         */
        public Builder apiKeyRequired(com.hashicorp.cdktf.IResolvable apiKeyRequired) {
            this.apiKeyRequired = apiKeyRequired;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getAuthorizationScopes}
         * @param authorizationScopes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#authorization_scopes ApiGatewayMethod#authorization_scopes}.
         * @return {@code this}
         */
        public Builder authorizationScopes(java.util.List<java.lang.String> authorizationScopes) {
            this.authorizationScopes = authorizationScopes;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getAuthorizerId}
         * @param authorizerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#authorizer_id ApiGatewayMethod#authorizer_id}.
         * @return {@code this}
         */
        public Builder authorizerId(java.lang.String authorizerId) {
            this.authorizerId = authorizerId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#id ApiGatewayMethod#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getOperationName}
         * @param operationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#operation_name ApiGatewayMethod#operation_name}.
         * @return {@code this}
         */
        public Builder operationName(java.lang.String operationName) {
            this.operationName = operationName;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getRequestModels}
         * @param requestModels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#request_models ApiGatewayMethod#request_models}.
         * @return {@code this}
         */
        public Builder requestModels(java.util.Map<java.lang.String, java.lang.String> requestModels) {
            this.requestModels = requestModels;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getRequestParameters}
         * @param requestParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#request_parameters ApiGatewayMethod#request_parameters}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder requestParameters(java.util.Map<java.lang.String, ? extends java.lang.Object> requestParameters) {
            this.requestParameters = (java.util.Map<java.lang.String, java.lang.Object>)requestParameters;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getRequestValidatorId}
         * @param requestValidatorId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method#request_validator_id ApiGatewayMethod#request_validator_id}.
         * @return {@code this}
         */
        public Builder requestValidatorId(java.lang.String requestValidatorId) {
            this.requestValidatorId = requestValidatorId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayMethodConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayMethodConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayMethodConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayMethodConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayMethodConfig {
        private final java.lang.String authorization;
        private final java.lang.String httpMethod;
        private final java.lang.String resourceId;
        private final java.lang.String restApiId;
        private final java.lang.Object apiKeyRequired;
        private final java.util.List<java.lang.String> authorizationScopes;
        private final java.lang.String authorizerId;
        private final java.lang.String id;
        private final java.lang.String operationName;
        private final java.util.Map<java.lang.String, java.lang.String> requestModels;
        private final java.util.Map<java.lang.String, java.lang.Object> requestParameters;
        private final java.lang.String requestValidatorId;
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
            this.authorization = software.amazon.jsii.Kernel.get(this, "authorization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpMethod = software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceId = software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restApiId = software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.apiKeyRequired = software.amazon.jsii.Kernel.get(this, "apiKeyRequired", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.authorizationScopes = software.amazon.jsii.Kernel.get(this, "authorizationScopes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.authorizerId = software.amazon.jsii.Kernel.get(this, "authorizerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operationName = software.amazon.jsii.Kernel.get(this, "operationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requestModels = software.amazon.jsii.Kernel.get(this, "requestModels", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.requestParameters = software.amazon.jsii.Kernel.get(this, "requestParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
            this.requestValidatorId = software.amazon.jsii.Kernel.get(this, "requestValidatorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.authorization = java.util.Objects.requireNonNull(builder.authorization, "authorization is required");
            this.httpMethod = java.util.Objects.requireNonNull(builder.httpMethod, "httpMethod is required");
            this.resourceId = java.util.Objects.requireNonNull(builder.resourceId, "resourceId is required");
            this.restApiId = java.util.Objects.requireNonNull(builder.restApiId, "restApiId is required");
            this.apiKeyRequired = builder.apiKeyRequired;
            this.authorizationScopes = builder.authorizationScopes;
            this.authorizerId = builder.authorizerId;
            this.id = builder.id;
            this.operationName = builder.operationName;
            this.requestModels = builder.requestModels;
            this.requestParameters = (java.util.Map<java.lang.String, java.lang.Object>)builder.requestParameters;
            this.requestValidatorId = builder.requestValidatorId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAuthorization() {
            return this.authorization;
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
        public final java.lang.Object getApiKeyRequired() {
            return this.apiKeyRequired;
        }

        @Override
        public final java.util.List<java.lang.String> getAuthorizationScopes() {
            return this.authorizationScopes;
        }

        @Override
        public final java.lang.String getAuthorizerId() {
            return this.authorizerId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getOperationName() {
            return this.operationName;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRequestModels() {
            return this.requestModels;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.Object> getRequestParameters() {
            return this.requestParameters;
        }

        @Override
        public final java.lang.String getRequestValidatorId() {
            return this.requestValidatorId;
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

            data.set("authorization", om.valueToTree(this.getAuthorization()));
            data.set("httpMethod", om.valueToTree(this.getHttpMethod()));
            data.set("resourceId", om.valueToTree(this.getResourceId()));
            data.set("restApiId", om.valueToTree(this.getRestApiId()));
            if (this.getApiKeyRequired() != null) {
                data.set("apiKeyRequired", om.valueToTree(this.getApiKeyRequired()));
            }
            if (this.getAuthorizationScopes() != null) {
                data.set("authorizationScopes", om.valueToTree(this.getAuthorizationScopes()));
            }
            if (this.getAuthorizerId() != null) {
                data.set("authorizerId", om.valueToTree(this.getAuthorizerId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOperationName() != null) {
                data.set("operationName", om.valueToTree(this.getOperationName()));
            }
            if (this.getRequestModels() != null) {
                data.set("requestModels", om.valueToTree(this.getRequestModels()));
            }
            if (this.getRequestParameters() != null) {
                data.set("requestParameters", om.valueToTree(this.getRequestParameters()));
            }
            if (this.getRequestValidatorId() != null) {
                data.set("requestValidatorId", om.valueToTree(this.getRequestValidatorId()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayMethod.ApiGatewayMethodConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayMethodConfig.Jsii$Proxy that = (ApiGatewayMethodConfig.Jsii$Proxy) o;

            if (!authorization.equals(that.authorization)) return false;
            if (!httpMethod.equals(that.httpMethod)) return false;
            if (!resourceId.equals(that.resourceId)) return false;
            if (!restApiId.equals(that.restApiId)) return false;
            if (this.apiKeyRequired != null ? !this.apiKeyRequired.equals(that.apiKeyRequired) : that.apiKeyRequired != null) return false;
            if (this.authorizationScopes != null ? !this.authorizationScopes.equals(that.authorizationScopes) : that.authorizationScopes != null) return false;
            if (this.authorizerId != null ? !this.authorizerId.equals(that.authorizerId) : that.authorizerId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.operationName != null ? !this.operationName.equals(that.operationName) : that.operationName != null) return false;
            if (this.requestModels != null ? !this.requestModels.equals(that.requestModels) : that.requestModels != null) return false;
            if (this.requestParameters != null ? !this.requestParameters.equals(that.requestParameters) : that.requestParameters != null) return false;
            if (this.requestValidatorId != null ? !this.requestValidatorId.equals(that.requestValidatorId) : that.requestValidatorId != null) return false;
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
            int result = this.authorization.hashCode();
            result = 31 * result + (this.httpMethod.hashCode());
            result = 31 * result + (this.resourceId.hashCode());
            result = 31 * result + (this.restApiId.hashCode());
            result = 31 * result + (this.apiKeyRequired != null ? this.apiKeyRequired.hashCode() : 0);
            result = 31 * result + (this.authorizationScopes != null ? this.authorizationScopes.hashCode() : 0);
            result = 31 * result + (this.authorizerId != null ? this.authorizerId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.operationName != null ? this.operationName.hashCode() : 0);
            result = 31 * result + (this.requestModels != null ? this.requestModels.hashCode() : 0);
            result = 31 * result + (this.requestParameters != null ? this.requestParameters.hashCode() : 0);
            result = 31 * result + (this.requestValidatorId != null ? this.requestValidatorId.hashCode() : 0);
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
