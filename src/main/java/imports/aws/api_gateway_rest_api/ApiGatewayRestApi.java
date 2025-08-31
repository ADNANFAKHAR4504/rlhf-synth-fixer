package imports.aws.api_gateway_rest_api;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api aws_api_gateway_rest_api}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.956Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayRestApi.ApiGatewayRestApi")
public class ApiGatewayRestApi extends com.hashicorp.cdktf.TerraformResource {

    protected ApiGatewayRestApi(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayRestApi(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.api_gateway_rest_api.ApiGatewayRestApi.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api aws_api_gateway_rest_api} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ApiGatewayRestApi(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_rest_api.ApiGatewayRestApiConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayRestApi resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayRestApi to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayRestApi that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ApiGatewayRestApi to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_rest_api.ApiGatewayRestApi.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayRestApi resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayRestApi to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayRestApi that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_rest_api.ApiGatewayRestApi.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEndpointConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putEndpointConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApiKeySource() {
        software.amazon.jsii.Kernel.call(this, "resetApiKeySource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBinaryMediaTypes() {
        software.amazon.jsii.Kernel.call(this, "resetBinaryMediaTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBody() {
        software.amazon.jsii.Kernel.call(this, "resetBody", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableExecuteApiEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetDisableExecuteApiEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailOnWarnings() {
        software.amazon.jsii.Kernel.call(this, "resetFailOnWarnings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumCompressionSize() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumCompressionSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPutRestApiMode() {
        software.amazon.jsii.Kernel.call(this, "resetPutRestApiMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedDate() {
        return software.amazon.jsii.Kernel.get(this, "createdDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfigurationOutputReference getEndpointConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "endpointConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionArn() {
        return software.amazon.jsii.Kernel.get(this, "executionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootResourceId() {
        return software.amazon.jsii.Kernel.get(this, "rootResourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiKeySourceInput() {
        return software.amazon.jsii.Kernel.get(this, "apiKeySourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getBinaryMediaTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "binaryMediaTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "bodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableExecuteApiEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "disableExecuteApiEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration getEndpointConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFailOnWarningsInput() {
        return software.amazon.jsii.Kernel.get(this, "failOnWarningsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMinimumCompressionSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumCompressionSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "policyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPutRestApiModeInput() {
        return software.amazon.jsii.Kernel.get(this, "putRestApiModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiKeySource() {
        return software.amazon.jsii.Kernel.get(this, "apiKeySource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiKeySource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiKeySource", java.util.Objects.requireNonNull(value, "apiKeySource is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getBinaryMediaTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "binaryMediaTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setBinaryMediaTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "binaryMediaTypes", java.util.Objects.requireNonNull(value, "binaryMediaTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBody() {
        return software.amazon.jsii.Kernel.get(this, "body", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "body", java.util.Objects.requireNonNull(value, "body is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getMinimumCompressionSize() {
        return software.amazon.jsii.Kernel.get(this, "minimumCompressionSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMinimumCompressionSize(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "minimumCompressionSize", java.util.Objects.requireNonNull(value, "minimumCompressionSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicy() {
        return software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policy", java.util.Objects.requireNonNull(value, "policy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPutRestApiMode() {
        return software.amazon.jsii.Kernel.get(this, "putRestApiMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPutRestApiMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "putRestApiMode", java.util.Objects.requireNonNull(value, "putRestApiMode is required"));
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

    /**
     * A fluent builder for {@link imports.aws.api_gateway_rest_api.ApiGatewayRestApi}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.api_gateway_rest_api.ApiGatewayRestApi> {
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
        private final imports.aws.api_gateway_rest_api.ApiGatewayRestApiConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.api_gateway_rest_api.ApiGatewayRestApiConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#name ApiGatewayRestApi#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#name ApiGatewayRestApi#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#api_key_source ApiGatewayRestApi#api_key_source}.
         * <p>
         * @return {@code this}
         * @param apiKeySource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#api_key_source ApiGatewayRestApi#api_key_source}. This parameter is required.
         */
        public Builder apiKeySource(final java.lang.String apiKeySource) {
            this.config.apiKeySource(apiKeySource);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#binary_media_types ApiGatewayRestApi#binary_media_types}.
         * <p>
         * @return {@code this}
         * @param binaryMediaTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#binary_media_types ApiGatewayRestApi#binary_media_types}. This parameter is required.
         */
        public Builder binaryMediaTypes(final java.util.List<java.lang.String> binaryMediaTypes) {
            this.config.binaryMediaTypes(binaryMediaTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#body ApiGatewayRestApi#body}.
         * <p>
         * @return {@code this}
         * @param body Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#body ApiGatewayRestApi#body}. This parameter is required.
         */
        public Builder body(final java.lang.String body) {
            this.config.body(body);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#description ApiGatewayRestApi#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#description ApiGatewayRestApi#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#disable_execute_api_endpoint ApiGatewayRestApi#disable_execute_api_endpoint}.
         * <p>
         * @return {@code this}
         * @param disableExecuteApiEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#disable_execute_api_endpoint ApiGatewayRestApi#disable_execute_api_endpoint}. This parameter is required.
         */
        public Builder disableExecuteApiEndpoint(final java.lang.Boolean disableExecuteApiEndpoint) {
            this.config.disableExecuteApiEndpoint(disableExecuteApiEndpoint);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#disable_execute_api_endpoint ApiGatewayRestApi#disable_execute_api_endpoint}.
         * <p>
         * @return {@code this}
         * @param disableExecuteApiEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#disable_execute_api_endpoint ApiGatewayRestApi#disable_execute_api_endpoint}. This parameter is required.
         */
        public Builder disableExecuteApiEndpoint(final com.hashicorp.cdktf.IResolvable disableExecuteApiEndpoint) {
            this.config.disableExecuteApiEndpoint(disableExecuteApiEndpoint);
            return this;
        }

        /**
         * endpoint_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#endpoint_configuration ApiGatewayRestApi#endpoint_configuration}
         * <p>
         * @return {@code this}
         * @param endpointConfiguration endpoint_configuration block. This parameter is required.
         */
        public Builder endpointConfiguration(final imports.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration endpointConfiguration) {
            this.config.endpointConfiguration(endpointConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#fail_on_warnings ApiGatewayRestApi#fail_on_warnings}.
         * <p>
         * @return {@code this}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#fail_on_warnings ApiGatewayRestApi#fail_on_warnings}. This parameter is required.
         */
        public Builder failOnWarnings(final java.lang.Boolean failOnWarnings) {
            this.config.failOnWarnings(failOnWarnings);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#fail_on_warnings ApiGatewayRestApi#fail_on_warnings}.
         * <p>
         * @return {@code this}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#fail_on_warnings ApiGatewayRestApi#fail_on_warnings}. This parameter is required.
         */
        public Builder failOnWarnings(final com.hashicorp.cdktf.IResolvable failOnWarnings) {
            this.config.failOnWarnings(failOnWarnings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#id ApiGatewayRestApi#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#id ApiGatewayRestApi#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#minimum_compression_size ApiGatewayRestApi#minimum_compression_size}.
         * <p>
         * @return {@code this}
         * @param minimumCompressionSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#minimum_compression_size ApiGatewayRestApi#minimum_compression_size}. This parameter is required.
         */
        public Builder minimumCompressionSize(final java.lang.String minimumCompressionSize) {
            this.config.minimumCompressionSize(minimumCompressionSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#parameters ApiGatewayRestApi#parameters}.
         * <p>
         * @return {@code this}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#parameters ApiGatewayRestApi#parameters}. This parameter is required.
         */
        public Builder parameters(final java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.config.parameters(parameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#policy ApiGatewayRestApi#policy}.
         * <p>
         * @return {@code this}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#policy ApiGatewayRestApi#policy}. This parameter is required.
         */
        public Builder policy(final java.lang.String policy) {
            this.config.policy(policy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#put_rest_api_mode ApiGatewayRestApi#put_rest_api_mode}.
         * <p>
         * @return {@code this}
         * @param putRestApiMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#put_rest_api_mode ApiGatewayRestApi#put_rest_api_mode}. This parameter is required.
         */
        public Builder putRestApiMode(final java.lang.String putRestApiMode) {
            this.config.putRestApiMode(putRestApiMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#tags ApiGatewayRestApi#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#tags ApiGatewayRestApi#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#tags_all ApiGatewayRestApi#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#tags_all ApiGatewayRestApi#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.api_gateway_rest_api.ApiGatewayRestApi}.
         */
        @Override
        public imports.aws.api_gateway_rest_api.ApiGatewayRestApi build() {
            return new imports.aws.api_gateway_rest_api.ApiGatewayRestApi(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
