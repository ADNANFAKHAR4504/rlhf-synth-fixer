package imports.aws.api_gateway_integration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration aws_api_gateway_integration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.947Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayIntegration.ApiGatewayIntegration")
public class ApiGatewayIntegration extends com.hashicorp.cdktf.TerraformResource {

    protected ApiGatewayIntegration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayIntegration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.api_gateway_integration.ApiGatewayIntegration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration aws_api_gateway_integration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ApiGatewayIntegration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_integration.ApiGatewayIntegrationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayIntegration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayIntegration to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayIntegration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ApiGatewayIntegration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_integration.ApiGatewayIntegration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayIntegration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayIntegration to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayIntegration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_integration.ApiGatewayIntegration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTlsConfig(final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig value) {
        software.amazon.jsii.Kernel.call(this, "putTlsConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCacheKeyParameters() {
        software.amazon.jsii.Kernel.call(this, "resetCacheKeyParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheNamespace() {
        software.amazon.jsii.Kernel.call(this, "resetCacheNamespace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionId() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionType() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentHandling() {
        software.amazon.jsii.Kernel.call(this, "resetContentHandling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCredentials() {
        software.amazon.jsii.Kernel.call(this, "resetCredentials", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIntegrationHttpMethod() {
        software.amazon.jsii.Kernel.call(this, "resetIntegrationHttpMethod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPassthroughBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetPassthroughBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestParameters() {
        software.amazon.jsii.Kernel.call(this, "resetRequestParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestTemplates() {
        software.amazon.jsii.Kernel.call(this, "resetRequestTemplates", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutMilliseconds() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutMilliseconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTlsConfig() {
        software.amazon.jsii.Kernel.call(this, "resetTlsConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUri() {
        software.amazon.jsii.Kernel.call(this, "resetUri", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfigOutputReference getTlsConfig() {
        return software.amazon.jsii.Kernel.get(this, "tlsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCacheKeyParametersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "cacheKeyParametersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCacheNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheNamespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentHandlingInput() {
        return software.amazon.jsii.Kernel.get(this, "contentHandlingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "httpMethodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntegrationHttpMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "integrationHttpMethodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPassthroughBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "passthroughBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "requestParametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestTemplatesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "requestTemplatesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRestApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "restApiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutMillisecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutMillisecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig getTlsConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "tlsConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUriInput() {
        return software.amazon.jsii.Kernel.get(this, "uriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCacheKeyParameters() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "cacheKeyParameters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCacheKeyParameters(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "cacheKeyParameters", java.util.Objects.requireNonNull(value, "cacheKeyParameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCacheNamespace() {
        return software.amazon.jsii.Kernel.get(this, "cacheNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCacheNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cacheNamespace", java.util.Objects.requireNonNull(value, "cacheNamespace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionId() {
        return software.amazon.jsii.Kernel.get(this, "connectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionId", java.util.Objects.requireNonNull(value, "connectionId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionType() {
        return software.amazon.jsii.Kernel.get(this, "connectionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionType", java.util.Objects.requireNonNull(value, "connectionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentHandling() {
        return software.amazon.jsii.Kernel.get(this, "contentHandling", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentHandling(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentHandling", java.util.Objects.requireNonNull(value, "contentHandling is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCredentials() {
        return software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCredentials(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "credentials", java.util.Objects.requireNonNull(value, "credentials is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpMethod() {
        return software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpMethod", java.util.Objects.requireNonNull(value, "httpMethod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntegrationHttpMethod() {
        return software.amazon.jsii.Kernel.get(this, "integrationHttpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntegrationHttpMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "integrationHttpMethod", java.util.Objects.requireNonNull(value, "integrationHttpMethod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPassthroughBehavior() {
        return software.amazon.jsii.Kernel.get(this, "passthroughBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPassthroughBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "passthroughBehavior", java.util.Objects.requireNonNull(value, "passthroughBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getRequestParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "requestParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRequestParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "requestParameters", java.util.Objects.requireNonNull(value, "requestParameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getRequestTemplates() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "requestTemplates", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRequestTemplates(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "requestTemplates", java.util.Objects.requireNonNull(value, "requestTemplates is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceId() {
        return software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceId", java.util.Objects.requireNonNull(value, "resourceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRestApiId() {
        return software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRestApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "restApiId", java.util.Objects.requireNonNull(value, "restApiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutMilliseconds() {
        return software.amazon.jsii.Kernel.get(this, "timeoutMilliseconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutMilliseconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutMilliseconds", java.util.Objects.requireNonNull(value, "timeoutMilliseconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUri() {
        return software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "uri", java.util.Objects.requireNonNull(value, "uri is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.api_gateway_integration.ApiGatewayIntegration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.api_gateway_integration.ApiGatewayIntegration> {
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
        private final imports.aws.api_gateway_integration.ApiGatewayIntegrationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.api_gateway_integration.ApiGatewayIntegrationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#http_method ApiGatewayIntegration#http_method}.
         * <p>
         * @return {@code this}
         * @param httpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#http_method ApiGatewayIntegration#http_method}. This parameter is required.
         */
        public Builder httpMethod(final java.lang.String httpMethod) {
            this.config.httpMethod(httpMethod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#resource_id ApiGatewayIntegration#resource_id}.
         * <p>
         * @return {@code this}
         * @param resourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#resource_id ApiGatewayIntegration#resource_id}. This parameter is required.
         */
        public Builder resourceId(final java.lang.String resourceId) {
            this.config.resourceId(resourceId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#rest_api_id ApiGatewayIntegration#rest_api_id}.
         * <p>
         * @return {@code this}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#rest_api_id ApiGatewayIntegration#rest_api_id}. This parameter is required.
         */
        public Builder restApiId(final java.lang.String restApiId) {
            this.config.restApiId(restApiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#type ApiGatewayIntegration#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#type ApiGatewayIntegration#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#cache_key_parameters ApiGatewayIntegration#cache_key_parameters}.
         * <p>
         * @return {@code this}
         * @param cacheKeyParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#cache_key_parameters ApiGatewayIntegration#cache_key_parameters}. This parameter is required.
         */
        public Builder cacheKeyParameters(final java.util.List<java.lang.String> cacheKeyParameters) {
            this.config.cacheKeyParameters(cacheKeyParameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#cache_namespace ApiGatewayIntegration#cache_namespace}.
         * <p>
         * @return {@code this}
         * @param cacheNamespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#cache_namespace ApiGatewayIntegration#cache_namespace}. This parameter is required.
         */
        public Builder cacheNamespace(final java.lang.String cacheNamespace) {
            this.config.cacheNamespace(cacheNamespace);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#connection_id ApiGatewayIntegration#connection_id}.
         * <p>
         * @return {@code this}
         * @param connectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#connection_id ApiGatewayIntegration#connection_id}. This parameter is required.
         */
        public Builder connectionId(final java.lang.String connectionId) {
            this.config.connectionId(connectionId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#connection_type ApiGatewayIntegration#connection_type}.
         * <p>
         * @return {@code this}
         * @param connectionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#connection_type ApiGatewayIntegration#connection_type}. This parameter is required.
         */
        public Builder connectionType(final java.lang.String connectionType) {
            this.config.connectionType(connectionType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#content_handling ApiGatewayIntegration#content_handling}.
         * <p>
         * @return {@code this}
         * @param contentHandling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#content_handling ApiGatewayIntegration#content_handling}. This parameter is required.
         */
        public Builder contentHandling(final java.lang.String contentHandling) {
            this.config.contentHandling(contentHandling);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#credentials ApiGatewayIntegration#credentials}.
         * <p>
         * @return {@code this}
         * @param credentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#credentials ApiGatewayIntegration#credentials}. This parameter is required.
         */
        public Builder credentials(final java.lang.String credentials) {
            this.config.credentials(credentials);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#id ApiGatewayIntegration#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#id ApiGatewayIntegration#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#integration_http_method ApiGatewayIntegration#integration_http_method}.
         * <p>
         * @return {@code this}
         * @param integrationHttpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#integration_http_method ApiGatewayIntegration#integration_http_method}. This parameter is required.
         */
        public Builder integrationHttpMethod(final java.lang.String integrationHttpMethod) {
            this.config.integrationHttpMethod(integrationHttpMethod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#passthrough_behavior ApiGatewayIntegration#passthrough_behavior}.
         * <p>
         * @return {@code this}
         * @param passthroughBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#passthrough_behavior ApiGatewayIntegration#passthrough_behavior}. This parameter is required.
         */
        public Builder passthroughBehavior(final java.lang.String passthroughBehavior) {
            this.config.passthroughBehavior(passthroughBehavior);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#request_parameters ApiGatewayIntegration#request_parameters}.
         * <p>
         * @return {@code this}
         * @param requestParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#request_parameters ApiGatewayIntegration#request_parameters}. This parameter is required.
         */
        public Builder requestParameters(final java.util.Map<java.lang.String, java.lang.String> requestParameters) {
            this.config.requestParameters(requestParameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#request_templates ApiGatewayIntegration#request_templates}.
         * <p>
         * @return {@code this}
         * @param requestTemplates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#request_templates ApiGatewayIntegration#request_templates}. This parameter is required.
         */
        public Builder requestTemplates(final java.util.Map<java.lang.String, java.lang.String> requestTemplates) {
            this.config.requestTemplates(requestTemplates);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#timeout_milliseconds ApiGatewayIntegration#timeout_milliseconds}.
         * <p>
         * @return {@code this}
         * @param timeoutMilliseconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#timeout_milliseconds ApiGatewayIntegration#timeout_milliseconds}. This parameter is required.
         */
        public Builder timeoutMilliseconds(final java.lang.Number timeoutMilliseconds) {
            this.config.timeoutMilliseconds(timeoutMilliseconds);
            return this;
        }

        /**
         * tls_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#tls_config ApiGatewayIntegration#tls_config}
         * <p>
         * @return {@code this}
         * @param tlsConfig tls_config block. This parameter is required.
         */
        public Builder tlsConfig(final imports.aws.api_gateway_integration.ApiGatewayIntegrationTlsConfig tlsConfig) {
            this.config.tlsConfig(tlsConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#uri ApiGatewayIntegration#uri}.
         * <p>
         * @return {@code this}
         * @param uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#uri ApiGatewayIntegration#uri}. This parameter is required.
         */
        public Builder uri(final java.lang.String uri) {
            this.config.uri(uri);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.api_gateway_integration.ApiGatewayIntegration}.
         */
        @Override
        public imports.aws.api_gateway_integration.ApiGatewayIntegration build() {
            return new imports.aws.api_gateway_integration.ApiGatewayIntegration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
