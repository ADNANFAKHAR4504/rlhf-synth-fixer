package imports.aws.api_gateway_stage;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage aws_api_gateway_stage}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.958Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayStage.ApiGatewayStage")
public class ApiGatewayStage extends com.hashicorp.cdktf.TerraformResource {

    protected ApiGatewayStage(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayStage(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.api_gateway_stage.ApiGatewayStage.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage aws_api_gateway_stage} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ApiGatewayStage(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_stage.ApiGatewayStageConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayStage resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayStage to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayStage that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ApiGatewayStage to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_stage.ApiGatewayStage.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayStage resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayStage to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayStage that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_stage.ApiGatewayStage.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAccessLogSettings(final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings value) {
        software.amazon.jsii.Kernel.call(this, "putAccessLogSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCanarySettings(final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings value) {
        software.amazon.jsii.Kernel.call(this, "putCanarySettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessLogSettings() {
        software.amazon.jsii.Kernel.call(this, "resetAccessLogSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheClusterEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCacheClusterEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheClusterSize() {
        software.amazon.jsii.Kernel.call(this, "resetCacheClusterSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCanarySettings() {
        software.amazon.jsii.Kernel.call(this, "resetCanarySettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientCertificateId() {
        software.amazon.jsii.Kernel.call(this, "resetClientCertificateId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentationVersion() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentationVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVariables() {
        software.amazon.jsii.Kernel.call(this, "resetVariables", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXrayTracingEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetXrayTracingEnabled", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettingsOutputReference getAccessLogSettings() {
        return software.amazon.jsii.Kernel.get(this, "accessLogSettings", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.api_gateway_stage.ApiGatewayStageCanarySettingsOutputReference getCanarySettings() {
        return software.amazon.jsii.Kernel.get(this, "canarySettings", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_stage.ApiGatewayStageCanarySettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionArn() {
        return software.amazon.jsii.Kernel.get(this, "executionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInvokeUrl() {
        return software.amazon.jsii.Kernel.get(this, "invokeUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWebAclArn() {
        return software.amazon.jsii.Kernel.get(this, "webAclArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings getAccessLogSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "accessLogSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCacheClusterEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheClusterEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCacheClusterSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheClusterSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings getCanarySettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "canarySettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientCertificateIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clientCertificateIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocumentationVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "documentationVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRestApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "restApiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStageNameInput() {
        return software.amazon.jsii.Kernel.get(this, "stageNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVariablesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "variablesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getXrayTracingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "xrayTracingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCacheClusterEnabled() {
        return software.amazon.jsii.Kernel.get(this, "cacheClusterEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCacheClusterEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cacheClusterEnabled", java.util.Objects.requireNonNull(value, "cacheClusterEnabled is required"));
    }

    public void setCacheClusterEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cacheClusterEnabled", java.util.Objects.requireNonNull(value, "cacheClusterEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCacheClusterSize() {
        return software.amazon.jsii.Kernel.get(this, "cacheClusterSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCacheClusterSize(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cacheClusterSize", java.util.Objects.requireNonNull(value, "cacheClusterSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientCertificateId() {
        return software.amazon.jsii.Kernel.get(this, "clientCertificateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientCertificateId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientCertificateId", java.util.Objects.requireNonNull(value, "clientCertificateId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentId() {
        return software.amazon.jsii.Kernel.get(this, "deploymentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentId", java.util.Objects.requireNonNull(value, "deploymentId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentationVersion() {
        return software.amazon.jsii.Kernel.get(this, "documentationVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocumentationVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "documentationVersion", java.util.Objects.requireNonNull(value, "documentationVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRestApiId() {
        return software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRestApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "restApiId", java.util.Objects.requireNonNull(value, "restApiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStageName() {
        return software.amazon.jsii.Kernel.get(this, "stageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStageName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stageName", java.util.Objects.requireNonNull(value, "stageName is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getVariables() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "variables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVariables(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "variables", java.util.Objects.requireNonNull(value, "variables is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getXrayTracingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "xrayTracingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setXrayTracingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "xrayTracingEnabled", java.util.Objects.requireNonNull(value, "xrayTracingEnabled is required"));
    }

    public void setXrayTracingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "xrayTracingEnabled", java.util.Objects.requireNonNull(value, "xrayTracingEnabled is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.api_gateway_stage.ApiGatewayStage}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.api_gateway_stage.ApiGatewayStage> {
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
        private final imports.aws.api_gateway_stage.ApiGatewayStageConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.api_gateway_stage.ApiGatewayStageConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#deployment_id ApiGatewayStage#deployment_id}.
         * <p>
         * @return {@code this}
         * @param deploymentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#deployment_id ApiGatewayStage#deployment_id}. This parameter is required.
         */
        public Builder deploymentId(final java.lang.String deploymentId) {
            this.config.deploymentId(deploymentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#rest_api_id ApiGatewayStage#rest_api_id}.
         * <p>
         * @return {@code this}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#rest_api_id ApiGatewayStage#rest_api_id}. This parameter is required.
         */
        public Builder restApiId(final java.lang.String restApiId) {
            this.config.restApiId(restApiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#stage_name ApiGatewayStage#stage_name}.
         * <p>
         * @return {@code this}
         * @param stageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#stage_name ApiGatewayStage#stage_name}. This parameter is required.
         */
        public Builder stageName(final java.lang.String stageName) {
            this.config.stageName(stageName);
            return this;
        }

        /**
         * access_log_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#access_log_settings ApiGatewayStage#access_log_settings}
         * <p>
         * @return {@code this}
         * @param accessLogSettings access_log_settings block. This parameter is required.
         */
        public Builder accessLogSettings(final imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings accessLogSettings) {
            this.config.accessLogSettings(accessLogSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_enabled ApiGatewayStage#cache_cluster_enabled}.
         * <p>
         * @return {@code this}
         * @param cacheClusterEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_enabled ApiGatewayStage#cache_cluster_enabled}. This parameter is required.
         */
        public Builder cacheClusterEnabled(final java.lang.Boolean cacheClusterEnabled) {
            this.config.cacheClusterEnabled(cacheClusterEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_enabled ApiGatewayStage#cache_cluster_enabled}.
         * <p>
         * @return {@code this}
         * @param cacheClusterEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_enabled ApiGatewayStage#cache_cluster_enabled}. This parameter is required.
         */
        public Builder cacheClusterEnabled(final com.hashicorp.cdktf.IResolvable cacheClusterEnabled) {
            this.config.cacheClusterEnabled(cacheClusterEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_size ApiGatewayStage#cache_cluster_size}.
         * <p>
         * @return {@code this}
         * @param cacheClusterSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_size ApiGatewayStage#cache_cluster_size}. This parameter is required.
         */
        public Builder cacheClusterSize(final java.lang.String cacheClusterSize) {
            this.config.cacheClusterSize(cacheClusterSize);
            return this;
        }

        /**
         * canary_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#canary_settings ApiGatewayStage#canary_settings}
         * <p>
         * @return {@code this}
         * @param canarySettings canary_settings block. This parameter is required.
         */
        public Builder canarySettings(final imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings canarySettings) {
            this.config.canarySettings(canarySettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#client_certificate_id ApiGatewayStage#client_certificate_id}.
         * <p>
         * @return {@code this}
         * @param clientCertificateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#client_certificate_id ApiGatewayStage#client_certificate_id}. This parameter is required.
         */
        public Builder clientCertificateId(final java.lang.String clientCertificateId) {
            this.config.clientCertificateId(clientCertificateId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#description ApiGatewayStage#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#description ApiGatewayStage#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#documentation_version ApiGatewayStage#documentation_version}.
         * <p>
         * @return {@code this}
         * @param documentationVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#documentation_version ApiGatewayStage#documentation_version}. This parameter is required.
         */
        public Builder documentationVersion(final java.lang.String documentationVersion) {
            this.config.documentationVersion(documentationVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#id ApiGatewayStage#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#id ApiGatewayStage#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#tags ApiGatewayStage#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#tags ApiGatewayStage#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#tags_all ApiGatewayStage#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#tags_all ApiGatewayStage#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#variables ApiGatewayStage#variables}.
         * <p>
         * @return {@code this}
         * @param variables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#variables ApiGatewayStage#variables}. This parameter is required.
         */
        public Builder variables(final java.util.Map<java.lang.String, java.lang.String> variables) {
            this.config.variables(variables);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#xray_tracing_enabled ApiGatewayStage#xray_tracing_enabled}.
         * <p>
         * @return {@code this}
         * @param xrayTracingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#xray_tracing_enabled ApiGatewayStage#xray_tracing_enabled}. This parameter is required.
         */
        public Builder xrayTracingEnabled(final java.lang.Boolean xrayTracingEnabled) {
            this.config.xrayTracingEnabled(xrayTracingEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#xray_tracing_enabled ApiGatewayStage#xray_tracing_enabled}.
         * <p>
         * @return {@code this}
         * @param xrayTracingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#xray_tracing_enabled ApiGatewayStage#xray_tracing_enabled}. This parameter is required.
         */
        public Builder xrayTracingEnabled(final com.hashicorp.cdktf.IResolvable xrayTracingEnabled) {
            this.config.xrayTracingEnabled(xrayTracingEnabled);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.api_gateway_stage.ApiGatewayStage}.
         */
        @Override
        public imports.aws.api_gateway_stage.ApiGatewayStage build() {
            return new imports.aws.api_gateway_stage.ApiGatewayStage(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
