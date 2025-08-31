package imports.aws.apigatewayv2_api;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api aws_apigatewayv2_api}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.962Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Api.Apigatewayv2Api")
public class Apigatewayv2Api extends com.hashicorp.cdktf.TerraformResource {

    protected Apigatewayv2Api(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Apigatewayv2Api(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.apigatewayv2_api.Apigatewayv2Api.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api aws_apigatewayv2_api} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Apigatewayv2Api(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_api.Apigatewayv2ApiConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2Api resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2Api to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2Api that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Apigatewayv2Api to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_api.Apigatewayv2Api.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2Api resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2Api to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2Api that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_api.Apigatewayv2Api.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCorsConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putCorsConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApiKeySelectionExpression() {
        software.amazon.jsii.Kernel.call(this, "resetApiKeySelectionExpression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBody() {
        software.amazon.jsii.Kernel.call(this, "resetBody", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCorsConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCorsConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCredentialsArn() {
        software.amazon.jsii.Kernel.call(this, "resetCredentialsArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableExecuteApiEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetDisableExecuteApiEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailOnWarnings() {
        software.amazon.jsii.Kernel.call(this, "resetFailOnWarnings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpAddressType() {
        software.amazon.jsii.Kernel.call(this, "resetIpAddressType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRouteKey() {
        software.amazon.jsii.Kernel.call(this, "resetRouteKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRouteSelectionExpression() {
        software.amazon.jsii.Kernel.call(this, "resetRouteSelectionExpression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTarget() {
        software.amazon.jsii.Kernel.call(this, "resetTarget", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getApiEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "apiEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfigurationOutputReference getCorsConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "corsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionArn() {
        return software.amazon.jsii.Kernel.get(this, "executionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiKeySelectionExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "apiKeySelectionExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "bodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration getCorsConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "corsConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCredentialsArnInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialsArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableExecuteApiEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "disableExecuteApiEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFailOnWarningsInput() {
        return software.amazon.jsii.Kernel.get(this, "failOnWarningsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpAddressTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRouteKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "routeKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRouteSelectionExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "routeSelectionExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "targetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiKeySelectionExpression() {
        return software.amazon.jsii.Kernel.get(this, "apiKeySelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiKeySelectionExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiKeySelectionExpression", java.util.Objects.requireNonNull(value, "apiKeySelectionExpression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBody() {
        return software.amazon.jsii.Kernel.get(this, "body", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "body", java.util.Objects.requireNonNull(value, "body is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCredentialsArn() {
        return software.amazon.jsii.Kernel.get(this, "credentialsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCredentialsArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "credentialsArn", java.util.Objects.requireNonNull(value, "credentialsArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableExecuteApiEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "disableExecuteApiEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableExecuteApiEndpoint(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableExecuteApiEndpoint", java.util.Objects.requireNonNull(value, "disableExecuteApiEndpoint is required"));
    }

    public void setDisableExecuteApiEndpoint(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableExecuteApiEndpoint", java.util.Objects.requireNonNull(value, "disableExecuteApiEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFailOnWarnings() {
        return software.amazon.jsii.Kernel.get(this, "failOnWarnings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFailOnWarnings(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "failOnWarnings", java.util.Objects.requireNonNull(value, "failOnWarnings is required"));
    }

    public void setFailOnWarnings(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "failOnWarnings", java.util.Objects.requireNonNull(value, "failOnWarnings is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpAddressType() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpAddressType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipAddressType", java.util.Objects.requireNonNull(value, "ipAddressType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocolType() {
        return software.amazon.jsii.Kernel.get(this, "protocolType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocolType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocolType", java.util.Objects.requireNonNull(value, "protocolType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRouteKey() {
        return software.amazon.jsii.Kernel.get(this, "routeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRouteKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routeKey", java.util.Objects.requireNonNull(value, "routeKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRouteSelectionExpression() {
        return software.amazon.jsii.Kernel.get(this, "routeSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRouteSelectionExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routeSelectionExpression", java.util.Objects.requireNonNull(value, "routeSelectionExpression is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTarget() {
        return software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTarget(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "target", java.util.Objects.requireNonNull(value, "target is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "version", java.util.Objects.requireNonNull(value, "version is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.apigatewayv2_api.Apigatewayv2Api}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.apigatewayv2_api.Apigatewayv2Api> {
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
        private final imports.aws.apigatewayv2_api.Apigatewayv2ApiConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.apigatewayv2_api.Apigatewayv2ApiConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#name Apigatewayv2Api#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#name Apigatewayv2Api#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#protocol_type Apigatewayv2Api#protocol_type}.
         * <p>
         * @return {@code this}
         * @param protocolType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#protocol_type Apigatewayv2Api#protocol_type}. This parameter is required.
         */
        public Builder protocolType(final java.lang.String protocolType) {
            this.config.protocolType(protocolType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#api_key_selection_expression Apigatewayv2Api#api_key_selection_expression}.
         * <p>
         * @return {@code this}
         * @param apiKeySelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#api_key_selection_expression Apigatewayv2Api#api_key_selection_expression}. This parameter is required.
         */
        public Builder apiKeySelectionExpression(final java.lang.String apiKeySelectionExpression) {
            this.config.apiKeySelectionExpression(apiKeySelectionExpression);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#body Apigatewayv2Api#body}.
         * <p>
         * @return {@code this}
         * @param body Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#body Apigatewayv2Api#body}. This parameter is required.
         */
        public Builder body(final java.lang.String body) {
            this.config.body(body);
            return this;
        }

        /**
         * cors_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#cors_configuration Apigatewayv2Api#cors_configuration}
         * <p>
         * @return {@code this}
         * @param corsConfiguration cors_configuration block. This parameter is required.
         */
        public Builder corsConfiguration(final imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration corsConfiguration) {
            this.config.corsConfiguration(corsConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#credentials_arn Apigatewayv2Api#credentials_arn}.
         * <p>
         * @return {@code this}
         * @param credentialsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#credentials_arn Apigatewayv2Api#credentials_arn}. This parameter is required.
         */
        public Builder credentialsArn(final java.lang.String credentialsArn) {
            this.config.credentialsArn(credentialsArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#description Apigatewayv2Api#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#description Apigatewayv2Api#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#disable_execute_api_endpoint Apigatewayv2Api#disable_execute_api_endpoint}.
         * <p>
         * @return {@code this}
         * @param disableExecuteApiEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#disable_execute_api_endpoint Apigatewayv2Api#disable_execute_api_endpoint}. This parameter is required.
         */
        public Builder disableExecuteApiEndpoint(final java.lang.Boolean disableExecuteApiEndpoint) {
            this.config.disableExecuteApiEndpoint(disableExecuteApiEndpoint);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#disable_execute_api_endpoint Apigatewayv2Api#disable_execute_api_endpoint}.
         * <p>
         * @return {@code this}
         * @param disableExecuteApiEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#disable_execute_api_endpoint Apigatewayv2Api#disable_execute_api_endpoint}. This parameter is required.
         */
        public Builder disableExecuteApiEndpoint(final com.hashicorp.cdktf.IResolvable disableExecuteApiEndpoint) {
            this.config.disableExecuteApiEndpoint(disableExecuteApiEndpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#fail_on_warnings Apigatewayv2Api#fail_on_warnings}.
         * <p>
         * @return {@code this}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#fail_on_warnings Apigatewayv2Api#fail_on_warnings}. This parameter is required.
         */
        public Builder failOnWarnings(final java.lang.Boolean failOnWarnings) {
            this.config.failOnWarnings(failOnWarnings);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#fail_on_warnings Apigatewayv2Api#fail_on_warnings}.
         * <p>
         * @return {@code this}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#fail_on_warnings Apigatewayv2Api#fail_on_warnings}. This parameter is required.
         */
        public Builder failOnWarnings(final com.hashicorp.cdktf.IResolvable failOnWarnings) {
            this.config.failOnWarnings(failOnWarnings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#id Apigatewayv2Api#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#id Apigatewayv2Api#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#ip_address_type Apigatewayv2Api#ip_address_type}.
         * <p>
         * @return {@code this}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#ip_address_type Apigatewayv2Api#ip_address_type}. This parameter is required.
         */
        public Builder ipAddressType(final java.lang.String ipAddressType) {
            this.config.ipAddressType(ipAddressType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#route_key Apigatewayv2Api#route_key}.
         * <p>
         * @return {@code this}
         * @param routeKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#route_key Apigatewayv2Api#route_key}. This parameter is required.
         */
        public Builder routeKey(final java.lang.String routeKey) {
            this.config.routeKey(routeKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#route_selection_expression Apigatewayv2Api#route_selection_expression}.
         * <p>
         * @return {@code this}
         * @param routeSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#route_selection_expression Apigatewayv2Api#route_selection_expression}. This parameter is required.
         */
        public Builder routeSelectionExpression(final java.lang.String routeSelectionExpression) {
            this.config.routeSelectionExpression(routeSelectionExpression);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#tags Apigatewayv2Api#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#tags Apigatewayv2Api#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#tags_all Apigatewayv2Api#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#tags_all Apigatewayv2Api#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#target Apigatewayv2Api#target}.
         * <p>
         * @return {@code this}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#target Apigatewayv2Api#target}. This parameter is required.
         */
        public Builder target(final java.lang.String target) {
            this.config.target(target);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#version Apigatewayv2Api#version}.
         * <p>
         * @return {@code this}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#version Apigatewayv2Api#version}. This parameter is required.
         */
        public Builder version(final java.lang.String version) {
            this.config.version(version);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.apigatewayv2_api.Apigatewayv2Api}.
         */
        @Override
        public imports.aws.apigatewayv2_api.Apigatewayv2Api build() {
            return new imports.aws.apigatewayv2_api.Apigatewayv2Api(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
