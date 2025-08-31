package imports.aws.apigatewayv2_route;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route aws_apigatewayv2_route}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.971Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Route.Apigatewayv2Route")
public class Apigatewayv2Route extends com.hashicorp.cdktf.TerraformResource {

    protected Apigatewayv2Route(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Apigatewayv2Route(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.apigatewayv2_route.Apigatewayv2Route.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route aws_apigatewayv2_route} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Apigatewayv2Route(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_route.Apigatewayv2RouteConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2Route resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2Route to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2Route that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Apigatewayv2Route to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_route.Apigatewayv2Route.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2Route resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2Route to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2Route that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_route.Apigatewayv2Route.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putRequestParameter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.apigatewayv2_route.Apigatewayv2RouteRequestParameter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.apigatewayv2_route.Apigatewayv2RouteRequestParameter> __cast_cd4240 = (java.util.List<imports.aws.apigatewayv2_route.Apigatewayv2RouteRequestParameter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.apigatewayv2_route.Apigatewayv2RouteRequestParameter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRequestParameter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApiKeyRequired() {
        software.amazon.jsii.Kernel.call(this, "resetApiKeyRequired", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthorizationScopes() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizationScopes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthorizationType() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthorizerId() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizerId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetModelSelectionExpression() {
        software.amazon.jsii.Kernel.call(this, "resetModelSelectionExpression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOperationName() {
        software.amazon.jsii.Kernel.call(this, "resetOperationName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestModels() {
        software.amazon.jsii.Kernel.call(this, "resetRequestModels", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestParameter() {
        software.amazon.jsii.Kernel.call(this, "resetRequestParameter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRouteResponseSelectionExpression() {
        software.amazon.jsii.Kernel.call(this, "resetRouteResponseSelectionExpression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTarget() {
        software.amazon.jsii.Kernel.call(this, "resetTarget", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_route.Apigatewayv2RouteRequestParameterList getRequestParameter() {
        return software.amazon.jsii.Kernel.get(this, "requestParameter", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_route.Apigatewayv2RouteRequestParameterList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "apiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApiKeyRequiredInput() {
        return software.amazon.jsii.Kernel.get(this, "apiKeyRequiredInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAuthorizationScopesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "authorizationScopesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerIdInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizerIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModelSelectionExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "modelSelectionExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOperationNameInput() {
        return software.amazon.jsii.Kernel.get(this, "operationNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestModelsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "requestModelsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequestParameterInput() {
        return software.amazon.jsii.Kernel.get(this, "requestParameterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRouteKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "routeKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRouteResponseSelectionExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "routeResponseSelectionExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "targetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiId() {
        return software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiId", java.util.Objects.requireNonNull(value, "apiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getApiKeyRequired() {
        return software.amazon.jsii.Kernel.get(this, "apiKeyRequired", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setApiKeyRequired(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "apiKeyRequired", java.util.Objects.requireNonNull(value, "apiKeyRequired is required"));
    }

    public void setApiKeyRequired(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "apiKeyRequired", java.util.Objects.requireNonNull(value, "apiKeyRequired is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAuthorizationScopes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "authorizationScopes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAuthorizationScopes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "authorizationScopes", java.util.Objects.requireNonNull(value, "authorizationScopes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthorizationType() {
        return software.amazon.jsii.Kernel.get(this, "authorizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthorizationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authorizationType", java.util.Objects.requireNonNull(value, "authorizationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthorizerId() {
        return software.amazon.jsii.Kernel.get(this, "authorizerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthorizerId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authorizerId", java.util.Objects.requireNonNull(value, "authorizerId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getModelSelectionExpression() {
        return software.amazon.jsii.Kernel.get(this, "modelSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setModelSelectionExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "modelSelectionExpression", java.util.Objects.requireNonNull(value, "modelSelectionExpression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOperationName() {
        return software.amazon.jsii.Kernel.get(this, "operationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOperationName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "operationName", java.util.Objects.requireNonNull(value, "operationName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getRequestModels() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "requestModels", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRequestModels(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "requestModels", java.util.Objects.requireNonNull(value, "requestModels is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRouteKey() {
        return software.amazon.jsii.Kernel.get(this, "routeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRouteKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routeKey", java.util.Objects.requireNonNull(value, "routeKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRouteResponseSelectionExpression() {
        return software.amazon.jsii.Kernel.get(this, "routeResponseSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRouteResponseSelectionExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routeResponseSelectionExpression", java.util.Objects.requireNonNull(value, "routeResponseSelectionExpression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTarget() {
        return software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTarget(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "target", java.util.Objects.requireNonNull(value, "target is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.apigatewayv2_route.Apigatewayv2Route}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.apigatewayv2_route.Apigatewayv2Route> {
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
        private final imports.aws.apigatewayv2_route.Apigatewayv2RouteConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.apigatewayv2_route.Apigatewayv2RouteConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_id Apigatewayv2Route#api_id}.
         * <p>
         * @return {@code this}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_id Apigatewayv2Route#api_id}. This parameter is required.
         */
        public Builder apiId(final java.lang.String apiId) {
            this.config.apiId(apiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#route_key Apigatewayv2Route#route_key}.
         * <p>
         * @return {@code this}
         * @param routeKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#route_key Apigatewayv2Route#route_key}. This parameter is required.
         */
        public Builder routeKey(final java.lang.String routeKey) {
            this.config.routeKey(routeKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_key_required Apigatewayv2Route#api_key_required}.
         * <p>
         * @return {@code this}
         * @param apiKeyRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_key_required Apigatewayv2Route#api_key_required}. This parameter is required.
         */
        public Builder apiKeyRequired(final java.lang.Boolean apiKeyRequired) {
            this.config.apiKeyRequired(apiKeyRequired);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_key_required Apigatewayv2Route#api_key_required}.
         * <p>
         * @return {@code this}
         * @param apiKeyRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#api_key_required Apigatewayv2Route#api_key_required}. This parameter is required.
         */
        public Builder apiKeyRequired(final com.hashicorp.cdktf.IResolvable apiKeyRequired) {
            this.config.apiKeyRequired(apiKeyRequired);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorization_scopes Apigatewayv2Route#authorization_scopes}.
         * <p>
         * @return {@code this}
         * @param authorizationScopes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorization_scopes Apigatewayv2Route#authorization_scopes}. This parameter is required.
         */
        public Builder authorizationScopes(final java.util.List<java.lang.String> authorizationScopes) {
            this.config.authorizationScopes(authorizationScopes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorization_type Apigatewayv2Route#authorization_type}.
         * <p>
         * @return {@code this}
         * @param authorizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorization_type Apigatewayv2Route#authorization_type}. This parameter is required.
         */
        public Builder authorizationType(final java.lang.String authorizationType) {
            this.config.authorizationType(authorizationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorizer_id Apigatewayv2Route#authorizer_id}.
         * <p>
         * @return {@code this}
         * @param authorizerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#authorizer_id Apigatewayv2Route#authorizer_id}. This parameter is required.
         */
        public Builder authorizerId(final java.lang.String authorizerId) {
            this.config.authorizerId(authorizerId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#id Apigatewayv2Route#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#id Apigatewayv2Route#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#model_selection_expression Apigatewayv2Route#model_selection_expression}.
         * <p>
         * @return {@code this}
         * @param modelSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#model_selection_expression Apigatewayv2Route#model_selection_expression}. This parameter is required.
         */
        public Builder modelSelectionExpression(final java.lang.String modelSelectionExpression) {
            this.config.modelSelectionExpression(modelSelectionExpression);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#operation_name Apigatewayv2Route#operation_name}.
         * <p>
         * @return {@code this}
         * @param operationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#operation_name Apigatewayv2Route#operation_name}. This parameter is required.
         */
        public Builder operationName(final java.lang.String operationName) {
            this.config.operationName(operationName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_models Apigatewayv2Route#request_models}.
         * <p>
         * @return {@code this}
         * @param requestModels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_models Apigatewayv2Route#request_models}. This parameter is required.
         */
        public Builder requestModels(final java.util.Map<java.lang.String, java.lang.String> requestModels) {
            this.config.requestModels(requestModels);
            return this;
        }

        /**
         * request_parameter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_parameter Apigatewayv2Route#request_parameter}
         * <p>
         * @return {@code this}
         * @param requestParameter request_parameter block. This parameter is required.
         */
        public Builder requestParameter(final com.hashicorp.cdktf.IResolvable requestParameter) {
            this.config.requestParameter(requestParameter);
            return this;
        }
        /**
         * request_parameter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_parameter Apigatewayv2Route#request_parameter}
         * <p>
         * @return {@code this}
         * @param requestParameter request_parameter block. This parameter is required.
         */
        public Builder requestParameter(final java.util.List<? extends imports.aws.apigatewayv2_route.Apigatewayv2RouteRequestParameter> requestParameter) {
            this.config.requestParameter(requestParameter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#route_response_selection_expression Apigatewayv2Route#route_response_selection_expression}.
         * <p>
         * @return {@code this}
         * @param routeResponseSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#route_response_selection_expression Apigatewayv2Route#route_response_selection_expression}. This parameter is required.
         */
        public Builder routeResponseSelectionExpression(final java.lang.String routeResponseSelectionExpression) {
            this.config.routeResponseSelectionExpression(routeResponseSelectionExpression);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#target Apigatewayv2Route#target}.
         * <p>
         * @return {@code this}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#target Apigatewayv2Route#target}. This parameter is required.
         */
        public Builder target(final java.lang.String target) {
            this.config.target(target);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.apigatewayv2_route.Apigatewayv2Route}.
         */
        @Override
        public imports.aws.apigatewayv2_route.Apigatewayv2Route build() {
            return new imports.aws.apigatewayv2_route.Apigatewayv2Route(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
