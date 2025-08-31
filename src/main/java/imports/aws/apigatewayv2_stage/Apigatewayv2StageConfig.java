package imports.aws.apigatewayv2_stage;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.973Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Stage.Apigatewayv2StageConfig")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2StageConfig.Jsii$Proxy.class)
public interface Apigatewayv2StageConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#api_id Apigatewayv2Stage#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#name Apigatewayv2Stage#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * access_log_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#access_log_settings Apigatewayv2Stage#access_log_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings getAccessLogSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#auto_deploy Apigatewayv2Stage#auto_deploy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoDeploy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#client_certificate_id Apigatewayv2Stage#client_certificate_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientCertificateId() {
        return null;
    }

    /**
     * default_route_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#default_route_settings Apigatewayv2Stage#default_route_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings getDefaultRouteSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#deployment_id Apigatewayv2Stage#deployment_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeploymentId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#description Apigatewayv2Stage#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#id Apigatewayv2Stage#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * route_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#route_settings Apigatewayv2Stage#route_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRouteSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#stage_variables Apigatewayv2Stage#stage_variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getStageVariables() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#tags Apigatewayv2Stage#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#tags_all Apigatewayv2Stage#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2StageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2StageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2StageConfig> {
        java.lang.String apiId;
        java.lang.String name;
        imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings accessLogSettings;
        java.lang.Object autoDeploy;
        java.lang.String clientCertificateId;
        imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings defaultRouteSettings;
        java.lang.String deploymentId;
        java.lang.String description;
        java.lang.String id;
        java.lang.Object routeSettings;
        java.util.Map<java.lang.String, java.lang.String> stageVariables;
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
         * Sets the value of {@link Apigatewayv2StageConfig#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#api_id Apigatewayv2Stage#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#name Apigatewayv2Stage#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getAccessLogSettings}
         * @param accessLogSettings access_log_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#access_log_settings Apigatewayv2Stage#access_log_settings}
         * @return {@code this}
         */
        public Builder accessLogSettings(imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings accessLogSettings) {
            this.accessLogSettings = accessLogSettings;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getAutoDeploy}
         * @param autoDeploy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#auto_deploy Apigatewayv2Stage#auto_deploy}.
         * @return {@code this}
         */
        public Builder autoDeploy(java.lang.Boolean autoDeploy) {
            this.autoDeploy = autoDeploy;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getAutoDeploy}
         * @param autoDeploy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#auto_deploy Apigatewayv2Stage#auto_deploy}.
         * @return {@code this}
         */
        public Builder autoDeploy(com.hashicorp.cdktf.IResolvable autoDeploy) {
            this.autoDeploy = autoDeploy;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getClientCertificateId}
         * @param clientCertificateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#client_certificate_id Apigatewayv2Stage#client_certificate_id}.
         * @return {@code this}
         */
        public Builder clientCertificateId(java.lang.String clientCertificateId) {
            this.clientCertificateId = clientCertificateId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getDefaultRouteSettings}
         * @param defaultRouteSettings default_route_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#default_route_settings Apigatewayv2Stage#default_route_settings}
         * @return {@code this}
         */
        public Builder defaultRouteSettings(imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings defaultRouteSettings) {
            this.defaultRouteSettings = defaultRouteSettings;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getDeploymentId}
         * @param deploymentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#deployment_id Apigatewayv2Stage#deployment_id}.
         * @return {@code this}
         */
        public Builder deploymentId(java.lang.String deploymentId) {
            this.deploymentId = deploymentId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#description Apigatewayv2Stage#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#id Apigatewayv2Stage#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getRouteSettings}
         * @param routeSettings route_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#route_settings Apigatewayv2Stage#route_settings}
         * @return {@code this}
         */
        public Builder routeSettings(com.hashicorp.cdktf.IResolvable routeSettings) {
            this.routeSettings = routeSettings;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getRouteSettings}
         * @param routeSettings route_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#route_settings Apigatewayv2Stage#route_settings}
         * @return {@code this}
         */
        public Builder routeSettings(java.util.List<? extends imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettings> routeSettings) {
            this.routeSettings = routeSettings;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getStageVariables}
         * @param stageVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#stage_variables Apigatewayv2Stage#stage_variables}.
         * @return {@code this}
         */
        public Builder stageVariables(java.util.Map<java.lang.String, java.lang.String> stageVariables) {
            this.stageVariables = stageVariables;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#tags Apigatewayv2Stage#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#tags_all Apigatewayv2Stage#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getDependsOn}
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
         * Sets the value of {@link Apigatewayv2StageConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageConfig#getProvisioners}
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
         * @return a new instance of {@link Apigatewayv2StageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2StageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2StageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2StageConfig {
        private final java.lang.String apiId;
        private final java.lang.String name;
        private final imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings accessLogSettings;
        private final java.lang.Object autoDeploy;
        private final java.lang.String clientCertificateId;
        private final imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings defaultRouteSettings;
        private final java.lang.String deploymentId;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.Object routeSettings;
        private final java.util.Map<java.lang.String, java.lang.String> stageVariables;
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
            this.apiId = software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessLogSettings = software.amazon.jsii.Kernel.get(this, "accessLogSettings", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings.class));
            this.autoDeploy = software.amazon.jsii.Kernel.get(this, "autoDeploy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.clientCertificateId = software.amazon.jsii.Kernel.get(this, "clientCertificateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultRouteSettings = software.amazon.jsii.Kernel.get(this, "defaultRouteSettings", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings.class));
            this.deploymentId = software.amazon.jsii.Kernel.get(this, "deploymentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routeSettings = software.amazon.jsii.Kernel.get(this, "routeSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stageVariables = software.amazon.jsii.Kernel.get(this, "stageVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.apiId = java.util.Objects.requireNonNull(builder.apiId, "apiId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.accessLogSettings = builder.accessLogSettings;
            this.autoDeploy = builder.autoDeploy;
            this.clientCertificateId = builder.clientCertificateId;
            this.defaultRouteSettings = builder.defaultRouteSettings;
            this.deploymentId = builder.deploymentId;
            this.description = builder.description;
            this.id = builder.id;
            this.routeSettings = builder.routeSettings;
            this.stageVariables = builder.stageVariables;
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
        public final java.lang.String getApiId() {
            return this.apiId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings getAccessLogSettings() {
            return this.accessLogSettings;
        }

        @Override
        public final java.lang.Object getAutoDeploy() {
            return this.autoDeploy;
        }

        @Override
        public final java.lang.String getClientCertificateId() {
            return this.clientCertificateId;
        }

        @Override
        public final imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings getDefaultRouteSettings() {
            return this.defaultRouteSettings;
        }

        @Override
        public final java.lang.String getDeploymentId() {
            return this.deploymentId;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getRouteSettings() {
            return this.routeSettings;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getStageVariables() {
            return this.stageVariables;
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

            data.set("apiId", om.valueToTree(this.getApiId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAccessLogSettings() != null) {
                data.set("accessLogSettings", om.valueToTree(this.getAccessLogSettings()));
            }
            if (this.getAutoDeploy() != null) {
                data.set("autoDeploy", om.valueToTree(this.getAutoDeploy()));
            }
            if (this.getClientCertificateId() != null) {
                data.set("clientCertificateId", om.valueToTree(this.getClientCertificateId()));
            }
            if (this.getDefaultRouteSettings() != null) {
                data.set("defaultRouteSettings", om.valueToTree(this.getDefaultRouteSettings()));
            }
            if (this.getDeploymentId() != null) {
                data.set("deploymentId", om.valueToTree(this.getDeploymentId()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRouteSettings() != null) {
                data.set("routeSettings", om.valueToTree(this.getRouteSettings()));
            }
            if (this.getStageVariables() != null) {
                data.set("stageVariables", om.valueToTree(this.getStageVariables()));
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
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Stage.Apigatewayv2StageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2StageConfig.Jsii$Proxy that = (Apigatewayv2StageConfig.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.accessLogSettings != null ? !this.accessLogSettings.equals(that.accessLogSettings) : that.accessLogSettings != null) return false;
            if (this.autoDeploy != null ? !this.autoDeploy.equals(that.autoDeploy) : that.autoDeploy != null) return false;
            if (this.clientCertificateId != null ? !this.clientCertificateId.equals(that.clientCertificateId) : that.clientCertificateId != null) return false;
            if (this.defaultRouteSettings != null ? !this.defaultRouteSettings.equals(that.defaultRouteSettings) : that.defaultRouteSettings != null) return false;
            if (this.deploymentId != null ? !this.deploymentId.equals(that.deploymentId) : that.deploymentId != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.routeSettings != null ? !this.routeSettings.equals(that.routeSettings) : that.routeSettings != null) return false;
            if (this.stageVariables != null ? !this.stageVariables.equals(that.stageVariables) : that.stageVariables != null) return false;
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
            int result = this.apiId.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.accessLogSettings != null ? this.accessLogSettings.hashCode() : 0);
            result = 31 * result + (this.autoDeploy != null ? this.autoDeploy.hashCode() : 0);
            result = 31 * result + (this.clientCertificateId != null ? this.clientCertificateId.hashCode() : 0);
            result = 31 * result + (this.defaultRouteSettings != null ? this.defaultRouteSettings.hashCode() : 0);
            result = 31 * result + (this.deploymentId != null ? this.deploymentId.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.routeSettings != null ? this.routeSettings.hashCode() : 0);
            result = 31 * result + (this.stageVariables != null ? this.stageVariables.hashCode() : 0);
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
