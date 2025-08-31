package imports.aws.api_gateway_stage;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.959Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayStage.ApiGatewayStageConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayStageConfig.Jsii$Proxy.class)
public interface ApiGatewayStageConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#deployment_id ApiGatewayStage#deployment_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeploymentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#rest_api_id ApiGatewayStage#rest_api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRestApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#stage_name ApiGatewayStage#stage_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStageName();

    /**
     * access_log_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#access_log_settings ApiGatewayStage#access_log_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings getAccessLogSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_enabled ApiGatewayStage#cache_cluster_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCacheClusterEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_size ApiGatewayStage#cache_cluster_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCacheClusterSize() {
        return null;
    }

    /**
     * canary_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#canary_settings ApiGatewayStage#canary_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings getCanarySettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#client_certificate_id ApiGatewayStage#client_certificate_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientCertificateId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#description ApiGatewayStage#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#documentation_version ApiGatewayStage#documentation_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentationVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#id ApiGatewayStage#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#tags ApiGatewayStage#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#tags_all ApiGatewayStage#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#variables ApiGatewayStage#variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVariables() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#xray_tracing_enabled ApiGatewayStage#xray_tracing_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getXrayTracingEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayStageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayStageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayStageConfig> {
        java.lang.String deploymentId;
        java.lang.String restApiId;
        java.lang.String stageName;
        imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings accessLogSettings;
        java.lang.Object cacheClusterEnabled;
        java.lang.String cacheClusterSize;
        imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings canarySettings;
        java.lang.String clientCertificateId;
        java.lang.String description;
        java.lang.String documentationVersion;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.util.Map<java.lang.String, java.lang.String> variables;
        java.lang.Object xrayTracingEnabled;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getDeploymentId}
         * @param deploymentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#deployment_id ApiGatewayStage#deployment_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder deploymentId(java.lang.String deploymentId) {
            this.deploymentId = deploymentId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getRestApiId}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#rest_api_id ApiGatewayStage#rest_api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder restApiId(java.lang.String restApiId) {
            this.restApiId = restApiId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getStageName}
         * @param stageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#stage_name ApiGatewayStage#stage_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder stageName(java.lang.String stageName) {
            this.stageName = stageName;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getAccessLogSettings}
         * @param accessLogSettings access_log_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#access_log_settings ApiGatewayStage#access_log_settings}
         * @return {@code this}
         */
        public Builder accessLogSettings(imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings accessLogSettings) {
            this.accessLogSettings = accessLogSettings;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getCacheClusterEnabled}
         * @param cacheClusterEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_enabled ApiGatewayStage#cache_cluster_enabled}.
         * @return {@code this}
         */
        public Builder cacheClusterEnabled(java.lang.Boolean cacheClusterEnabled) {
            this.cacheClusterEnabled = cacheClusterEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getCacheClusterEnabled}
         * @param cacheClusterEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_enabled ApiGatewayStage#cache_cluster_enabled}.
         * @return {@code this}
         */
        public Builder cacheClusterEnabled(com.hashicorp.cdktf.IResolvable cacheClusterEnabled) {
            this.cacheClusterEnabled = cacheClusterEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getCacheClusterSize}
         * @param cacheClusterSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#cache_cluster_size ApiGatewayStage#cache_cluster_size}.
         * @return {@code this}
         */
        public Builder cacheClusterSize(java.lang.String cacheClusterSize) {
            this.cacheClusterSize = cacheClusterSize;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getCanarySettings}
         * @param canarySettings canary_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#canary_settings ApiGatewayStage#canary_settings}
         * @return {@code this}
         */
        public Builder canarySettings(imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings canarySettings) {
            this.canarySettings = canarySettings;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getClientCertificateId}
         * @param clientCertificateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#client_certificate_id ApiGatewayStage#client_certificate_id}.
         * @return {@code this}
         */
        public Builder clientCertificateId(java.lang.String clientCertificateId) {
            this.clientCertificateId = clientCertificateId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#description ApiGatewayStage#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getDocumentationVersion}
         * @param documentationVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#documentation_version ApiGatewayStage#documentation_version}.
         * @return {@code this}
         */
        public Builder documentationVersion(java.lang.String documentationVersion) {
            this.documentationVersion = documentationVersion;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#id ApiGatewayStage#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#tags ApiGatewayStage#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#tags_all ApiGatewayStage#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getVariables}
         * @param variables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#variables ApiGatewayStage#variables}.
         * @return {@code this}
         */
        public Builder variables(java.util.Map<java.lang.String, java.lang.String> variables) {
            this.variables = variables;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getXrayTracingEnabled}
         * @param xrayTracingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#xray_tracing_enabled ApiGatewayStage#xray_tracing_enabled}.
         * @return {@code this}
         */
        public Builder xrayTracingEnabled(java.lang.Boolean xrayTracingEnabled) {
            this.xrayTracingEnabled = xrayTracingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getXrayTracingEnabled}
         * @param xrayTracingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_stage#xray_tracing_enabled ApiGatewayStage#xray_tracing_enabled}.
         * @return {@code this}
         */
        public Builder xrayTracingEnabled(com.hashicorp.cdktf.IResolvable xrayTracingEnabled) {
            this.xrayTracingEnabled = xrayTracingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayStageConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayStageConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayStageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayStageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayStageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayStageConfig {
        private final java.lang.String deploymentId;
        private final java.lang.String restApiId;
        private final java.lang.String stageName;
        private final imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings accessLogSettings;
        private final java.lang.Object cacheClusterEnabled;
        private final java.lang.String cacheClusterSize;
        private final imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings canarySettings;
        private final java.lang.String clientCertificateId;
        private final java.lang.String description;
        private final java.lang.String documentationVersion;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.util.Map<java.lang.String, java.lang.String> variables;
        private final java.lang.Object xrayTracingEnabled;
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
            this.deploymentId = software.amazon.jsii.Kernel.get(this, "deploymentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restApiId = software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stageName = software.amazon.jsii.Kernel.get(this, "stageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessLogSettings = software.amazon.jsii.Kernel.get(this, "accessLogSettings", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings.class));
            this.cacheClusterEnabled = software.amazon.jsii.Kernel.get(this, "cacheClusterEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cacheClusterSize = software.amazon.jsii.Kernel.get(this, "cacheClusterSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.canarySettings = software.amazon.jsii.Kernel.get(this, "canarySettings", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings.class));
            this.clientCertificateId = software.amazon.jsii.Kernel.get(this, "clientCertificateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentationVersion = software.amazon.jsii.Kernel.get(this, "documentationVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.variables = software.amazon.jsii.Kernel.get(this, "variables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.xrayTracingEnabled = software.amazon.jsii.Kernel.get(this, "xrayTracingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.deploymentId = java.util.Objects.requireNonNull(builder.deploymentId, "deploymentId is required");
            this.restApiId = java.util.Objects.requireNonNull(builder.restApiId, "restApiId is required");
            this.stageName = java.util.Objects.requireNonNull(builder.stageName, "stageName is required");
            this.accessLogSettings = builder.accessLogSettings;
            this.cacheClusterEnabled = builder.cacheClusterEnabled;
            this.cacheClusterSize = builder.cacheClusterSize;
            this.canarySettings = builder.canarySettings;
            this.clientCertificateId = builder.clientCertificateId;
            this.description = builder.description;
            this.documentationVersion = builder.documentationVersion;
            this.id = builder.id;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.variables = builder.variables;
            this.xrayTracingEnabled = builder.xrayTracingEnabled;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDeploymentId() {
            return this.deploymentId;
        }

        @Override
        public final java.lang.String getRestApiId() {
            return this.restApiId;
        }

        @Override
        public final java.lang.String getStageName() {
            return this.stageName;
        }

        @Override
        public final imports.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings getAccessLogSettings() {
            return this.accessLogSettings;
        }

        @Override
        public final java.lang.Object getCacheClusterEnabled() {
            return this.cacheClusterEnabled;
        }

        @Override
        public final java.lang.String getCacheClusterSize() {
            return this.cacheClusterSize;
        }

        @Override
        public final imports.aws.api_gateway_stage.ApiGatewayStageCanarySettings getCanarySettings() {
            return this.canarySettings;
        }

        @Override
        public final java.lang.String getClientCertificateId() {
            return this.clientCertificateId;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDocumentationVersion() {
            return this.documentationVersion;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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
        public final java.util.Map<java.lang.String, java.lang.String> getVariables() {
            return this.variables;
        }

        @Override
        public final java.lang.Object getXrayTracingEnabled() {
            return this.xrayTracingEnabled;
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

            data.set("deploymentId", om.valueToTree(this.getDeploymentId()));
            data.set("restApiId", om.valueToTree(this.getRestApiId()));
            data.set("stageName", om.valueToTree(this.getStageName()));
            if (this.getAccessLogSettings() != null) {
                data.set("accessLogSettings", om.valueToTree(this.getAccessLogSettings()));
            }
            if (this.getCacheClusterEnabled() != null) {
                data.set("cacheClusterEnabled", om.valueToTree(this.getCacheClusterEnabled()));
            }
            if (this.getCacheClusterSize() != null) {
                data.set("cacheClusterSize", om.valueToTree(this.getCacheClusterSize()));
            }
            if (this.getCanarySettings() != null) {
                data.set("canarySettings", om.valueToTree(this.getCanarySettings()));
            }
            if (this.getClientCertificateId() != null) {
                data.set("clientCertificateId", om.valueToTree(this.getClientCertificateId()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDocumentationVersion() != null) {
                data.set("documentationVersion", om.valueToTree(this.getDocumentationVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getVariables() != null) {
                data.set("variables", om.valueToTree(this.getVariables()));
            }
            if (this.getXrayTracingEnabled() != null) {
                data.set("xrayTracingEnabled", om.valueToTree(this.getXrayTracingEnabled()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayStage.ApiGatewayStageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayStageConfig.Jsii$Proxy that = (ApiGatewayStageConfig.Jsii$Proxy) o;

            if (!deploymentId.equals(that.deploymentId)) return false;
            if (!restApiId.equals(that.restApiId)) return false;
            if (!stageName.equals(that.stageName)) return false;
            if (this.accessLogSettings != null ? !this.accessLogSettings.equals(that.accessLogSettings) : that.accessLogSettings != null) return false;
            if (this.cacheClusterEnabled != null ? !this.cacheClusterEnabled.equals(that.cacheClusterEnabled) : that.cacheClusterEnabled != null) return false;
            if (this.cacheClusterSize != null ? !this.cacheClusterSize.equals(that.cacheClusterSize) : that.cacheClusterSize != null) return false;
            if (this.canarySettings != null ? !this.canarySettings.equals(that.canarySettings) : that.canarySettings != null) return false;
            if (this.clientCertificateId != null ? !this.clientCertificateId.equals(that.clientCertificateId) : that.clientCertificateId != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.documentationVersion != null ? !this.documentationVersion.equals(that.documentationVersion) : that.documentationVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.variables != null ? !this.variables.equals(that.variables) : that.variables != null) return false;
            if (this.xrayTracingEnabled != null ? !this.xrayTracingEnabled.equals(that.xrayTracingEnabled) : that.xrayTracingEnabled != null) return false;
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
            int result = this.deploymentId.hashCode();
            result = 31 * result + (this.restApiId.hashCode());
            result = 31 * result + (this.stageName.hashCode());
            result = 31 * result + (this.accessLogSettings != null ? this.accessLogSettings.hashCode() : 0);
            result = 31 * result + (this.cacheClusterEnabled != null ? this.cacheClusterEnabled.hashCode() : 0);
            result = 31 * result + (this.cacheClusterSize != null ? this.cacheClusterSize.hashCode() : 0);
            result = 31 * result + (this.canarySettings != null ? this.canarySettings.hashCode() : 0);
            result = 31 * result + (this.clientCertificateId != null ? this.clientCertificateId.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.documentationVersion != null ? this.documentationVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.variables != null ? this.variables.hashCode() : 0);
            result = 31 * result + (this.xrayTracingEnabled != null ? this.xrayTracingEnabled.hashCode() : 0);
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
