package imports.aws.apigatewayv2_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.972Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Route.Apigatewayv2RouteConfig")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2RouteConfig.Jsii$Proxy.class)
public interface Apigatewayv2RouteConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_id Apigatewayv2Route#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#route_key Apigatewayv2Route#route_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRouteKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_key_required Apigatewayv2Route#api_key_required}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApiKeyRequired() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorization_scopes Apigatewayv2Route#authorization_scopes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAuthorizationScopes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorization_type Apigatewayv2Route#authorization_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorizer_id Apigatewayv2Route#authorizer_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#id Apigatewayv2Route#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#model_selection_expression Apigatewayv2Route#model_selection_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getModelSelectionExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#operation_name Apigatewayv2Route#operation_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOperationName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_models Apigatewayv2Route#request_models}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestModels() {
        return null;
    }

    /**
     * request_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_parameter Apigatewayv2Route#request_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequestParameter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#route_response_selection_expression Apigatewayv2Route#route_response_selection_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRouteResponseSelectionExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#target Apigatewayv2Route#target}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTarget() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2RouteConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2RouteConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2RouteConfig> {
        java.lang.String apiId;
        java.lang.String routeKey;
        java.lang.Object apiKeyRequired;
        java.util.List<java.lang.String> authorizationScopes;
        java.lang.String authorizationType;
        java.lang.String authorizerId;
        java.lang.String id;
        java.lang.String modelSelectionExpression;
        java.lang.String operationName;
        java.util.Map<java.lang.String, java.lang.String> requestModels;
        java.lang.Object requestParameter;
        java.lang.String routeResponseSelectionExpression;
        java.lang.String target;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_id Apigatewayv2Route#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getRouteKey}
         * @param routeKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#route_key Apigatewayv2Route#route_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder routeKey(java.lang.String routeKey) {
            this.routeKey = routeKey;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getApiKeyRequired}
         * @param apiKeyRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_key_required Apigatewayv2Route#api_key_required}.
         * @return {@code this}
         */
        public Builder apiKeyRequired(java.lang.Boolean apiKeyRequired) {
            this.apiKeyRequired = apiKeyRequired;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getApiKeyRequired}
         * @param apiKeyRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_key_required Apigatewayv2Route#api_key_required}.
         * @return {@code this}
         */
        public Builder apiKeyRequired(com.hashicorp.cdktf.IResolvable apiKeyRequired) {
            this.apiKeyRequired = apiKeyRequired;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getAuthorizationScopes}
         * @param authorizationScopes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorization_scopes Apigatewayv2Route#authorization_scopes}.
         * @return {@code this}
         */
        public Builder authorizationScopes(java.util.List<java.lang.String> authorizationScopes) {
            this.authorizationScopes = authorizationScopes;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getAuthorizationType}
         * @param authorizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorization_type Apigatewayv2Route#authorization_type}.
         * @return {@code this}
         */
        public Builder authorizationType(java.lang.String authorizationType) {
            this.authorizationType = authorizationType;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getAuthorizerId}
         * @param authorizerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorizer_id Apigatewayv2Route#authorizer_id}.
         * @return {@code this}
         */
        public Builder authorizerId(java.lang.String authorizerId) {
            this.authorizerId = authorizerId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#id Apigatewayv2Route#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getModelSelectionExpression}
         * @param modelSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#model_selection_expression Apigatewayv2Route#model_selection_expression}.
         * @return {@code this}
         */
        public Builder modelSelectionExpression(java.lang.String modelSelectionExpression) {
            this.modelSelectionExpression = modelSelectionExpression;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getOperationName}
         * @param operationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#operation_name Apigatewayv2Route#operation_name}.
         * @return {@code this}
         */
        public Builder operationName(java.lang.String operationName) {
            this.operationName = operationName;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getRequestModels}
         * @param requestModels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_models Apigatewayv2Route#request_models}.
         * @return {@code this}
         */
        public Builder requestModels(java.util.Map<java.lang.String, java.lang.String> requestModels) {
            this.requestModels = requestModels;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getRequestParameter}
         * @param requestParameter request_parameter block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_parameter Apigatewayv2Route#request_parameter}
         * @return {@code this}
         */
        public Builder requestParameter(com.hashicorp.cdktf.IResolvable requestParameter) {
            this.requestParameter = requestParameter;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getRequestParameter}
         * @param requestParameter request_parameter block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_parameter Apigatewayv2Route#request_parameter}
         * @return {@code this}
         */
        public Builder requestParameter(java.util.List<? extends imports.aws.apigatewayv2_route.Apigatewayv2RouteRequestParameter> requestParameter) {
            this.requestParameter = requestParameter;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getRouteResponseSelectionExpression}
         * @param routeResponseSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#route_response_selection_expression Apigatewayv2Route#route_response_selection_expression}.
         * @return {@code this}
         */
        public Builder routeResponseSelectionExpression(java.lang.String routeResponseSelectionExpression) {
            this.routeResponseSelectionExpression = routeResponseSelectionExpression;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getTarget}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#target Apigatewayv2Route#target}.
         * @return {@code this}
         */
        public Builder target(java.lang.String target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getDependsOn}
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
         * Sets the value of {@link Apigatewayv2RouteConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteConfig#getProvisioners}
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
         * @return a new instance of {@link Apigatewayv2RouteConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2RouteConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2RouteConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2RouteConfig {
        private final java.lang.String apiId;
        private final java.lang.String routeKey;
        private final java.lang.Object apiKeyRequired;
        private final java.util.List<java.lang.String> authorizationScopes;
        private final java.lang.String authorizationType;
        private final java.lang.String authorizerId;
        private final java.lang.String id;
        private final java.lang.String modelSelectionExpression;
        private final java.lang.String operationName;
        private final java.util.Map<java.lang.String, java.lang.String> requestModels;
        private final java.lang.Object requestParameter;
        private final java.lang.String routeResponseSelectionExpression;
        private final java.lang.String target;
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
            this.routeKey = software.amazon.jsii.Kernel.get(this, "routeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.apiKeyRequired = software.amazon.jsii.Kernel.get(this, "apiKeyRequired", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.authorizationScopes = software.amazon.jsii.Kernel.get(this, "authorizationScopes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.authorizationType = software.amazon.jsii.Kernel.get(this, "authorizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerId = software.amazon.jsii.Kernel.get(this, "authorizerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.modelSelectionExpression = software.amazon.jsii.Kernel.get(this, "modelSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operationName = software.amazon.jsii.Kernel.get(this, "operationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requestModels = software.amazon.jsii.Kernel.get(this, "requestModels", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.requestParameter = software.amazon.jsii.Kernel.get(this, "requestParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.routeResponseSelectionExpression = software.amazon.jsii.Kernel.get(this, "routeResponseSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.routeKey = java.util.Objects.requireNonNull(builder.routeKey, "routeKey is required");
            this.apiKeyRequired = builder.apiKeyRequired;
            this.authorizationScopes = builder.authorizationScopes;
            this.authorizationType = builder.authorizationType;
            this.authorizerId = builder.authorizerId;
            this.id = builder.id;
            this.modelSelectionExpression = builder.modelSelectionExpression;
            this.operationName = builder.operationName;
            this.requestModels = builder.requestModels;
            this.requestParameter = builder.requestParameter;
            this.routeResponseSelectionExpression = builder.routeResponseSelectionExpression;
            this.target = builder.target;
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
        public final java.lang.String getRouteKey() {
            return this.routeKey;
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
        public final java.lang.String getAuthorizationType() {
            return this.authorizationType;
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
        public final java.lang.String getModelSelectionExpression() {
            return this.modelSelectionExpression;
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
        public final java.lang.Object getRequestParameter() {
            return this.requestParameter;
        }

        @Override
        public final java.lang.String getRouteResponseSelectionExpression() {
            return this.routeResponseSelectionExpression;
        }

        @Override
        public final java.lang.String getTarget() {
            return this.target;
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
            data.set("routeKey", om.valueToTree(this.getRouteKey()));
            if (this.getApiKeyRequired() != null) {
                data.set("apiKeyRequired", om.valueToTree(this.getApiKeyRequired()));
            }
            if (this.getAuthorizationScopes() != null) {
                data.set("authorizationScopes", om.valueToTree(this.getAuthorizationScopes()));
            }
            if (this.getAuthorizationType() != null) {
                data.set("authorizationType", om.valueToTree(this.getAuthorizationType()));
            }
            if (this.getAuthorizerId() != null) {
                data.set("authorizerId", om.valueToTree(this.getAuthorizerId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getModelSelectionExpression() != null) {
                data.set("modelSelectionExpression", om.valueToTree(this.getModelSelectionExpression()));
            }
            if (this.getOperationName() != null) {
                data.set("operationName", om.valueToTree(this.getOperationName()));
            }
            if (this.getRequestModels() != null) {
                data.set("requestModels", om.valueToTree(this.getRequestModels()));
            }
            if (this.getRequestParameter() != null) {
                data.set("requestParameter", om.valueToTree(this.getRequestParameter()));
            }
            if (this.getRouteResponseSelectionExpression() != null) {
                data.set("routeResponseSelectionExpression", om.valueToTree(this.getRouteResponseSelectionExpression()));
            }
            if (this.getTarget() != null) {
                data.set("target", om.valueToTree(this.getTarget()));
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
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Route.Apigatewayv2RouteConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2RouteConfig.Jsii$Proxy that = (Apigatewayv2RouteConfig.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!routeKey.equals(that.routeKey)) return false;
            if (this.apiKeyRequired != null ? !this.apiKeyRequired.equals(that.apiKeyRequired) : that.apiKeyRequired != null) return false;
            if (this.authorizationScopes != null ? !this.authorizationScopes.equals(that.authorizationScopes) : that.authorizationScopes != null) return false;
            if (this.authorizationType != null ? !this.authorizationType.equals(that.authorizationType) : that.authorizationType != null) return false;
            if (this.authorizerId != null ? !this.authorizerId.equals(that.authorizerId) : that.authorizerId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.modelSelectionExpression != null ? !this.modelSelectionExpression.equals(that.modelSelectionExpression) : that.modelSelectionExpression != null) return false;
            if (this.operationName != null ? !this.operationName.equals(that.operationName) : that.operationName != null) return false;
            if (this.requestModels != null ? !this.requestModels.equals(that.requestModels) : that.requestModels != null) return false;
            if (this.requestParameter != null ? !this.requestParameter.equals(that.requestParameter) : that.requestParameter != null) return false;
            if (this.routeResponseSelectionExpression != null ? !this.routeResponseSelectionExpression.equals(that.routeResponseSelectionExpression) : that.routeResponseSelectionExpression != null) return false;
            if (this.target != null ? !this.target.equals(that.target) : that.target != null) return false;
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
            result = 31 * result + (this.routeKey.hashCode());
            result = 31 * result + (this.apiKeyRequired != null ? this.apiKeyRequired.hashCode() : 0);
            result = 31 * result + (this.authorizationScopes != null ? this.authorizationScopes.hashCode() : 0);
            result = 31 * result + (this.authorizationType != null ? this.authorizationType.hashCode() : 0);
            result = 31 * result + (this.authorizerId != null ? this.authorizerId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.modelSelectionExpression != null ? this.modelSelectionExpression.hashCode() : 0);
            result = 31 * result + (this.operationName != null ? this.operationName.hashCode() : 0);
            result = 31 * result + (this.requestModels != null ? this.requestModels.hashCode() : 0);
            result = 31 * result + (this.requestParameter != null ? this.requestParameter.hashCode() : 0);
            result = 31 * result + (this.routeResponseSelectionExpression != null ? this.routeResponseSelectionExpression.hashCode() : 0);
            result = 31 * result + (this.target != null ? this.target.hashCode() : 0);
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
