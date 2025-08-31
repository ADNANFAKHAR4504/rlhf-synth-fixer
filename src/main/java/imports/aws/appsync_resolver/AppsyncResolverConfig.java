package imports.aws.appsync_resolver;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncResolver.AppsyncResolverConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncResolverConfig.Jsii$Proxy.class)
public interface AppsyncResolverConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#api_id AppsyncResolver#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#field AppsyncResolver#field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getField();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#type AppsyncResolver#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * caching_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#caching_config AppsyncResolver#caching_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverCachingConfig getCachingConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#code AppsyncResolver#code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#data_source AppsyncResolver#data_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#id AppsyncResolver#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#kind AppsyncResolver#kind}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKind() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#max_batch_size AppsyncResolver#max_batch_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxBatchSize() {
        return null;
    }

    /**
     * pipeline_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#pipeline_config AppsyncResolver#pipeline_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverPipelineConfig getPipelineConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#request_template AppsyncResolver#request_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRequestTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#response_template AppsyncResolver#response_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResponseTemplate() {
        return null;
    }

    /**
     * runtime block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#runtime AppsyncResolver#runtime}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverRuntime getRuntime() {
        return null;
    }

    /**
     * sync_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#sync_config AppsyncResolver#sync_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverSyncConfig getSyncConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncResolverConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncResolverConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncResolverConfig> {
        java.lang.String apiId;
        java.lang.String field;
        java.lang.String type;
        imports.aws.appsync_resolver.AppsyncResolverCachingConfig cachingConfig;
        java.lang.String code;
        java.lang.String dataSource;
        java.lang.String id;
        java.lang.String kind;
        java.lang.Number maxBatchSize;
        imports.aws.appsync_resolver.AppsyncResolverPipelineConfig pipelineConfig;
        java.lang.String requestTemplate;
        java.lang.String responseTemplate;
        imports.aws.appsync_resolver.AppsyncResolverRuntime runtime;
        imports.aws.appsync_resolver.AppsyncResolverSyncConfig syncConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AppsyncResolverConfig#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#api_id AppsyncResolver#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getField}
         * @param field Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#field AppsyncResolver#field}. This parameter is required.
         * @return {@code this}
         */
        public Builder field(java.lang.String field) {
            this.field = field;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#type AppsyncResolver#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getCachingConfig}
         * @param cachingConfig caching_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#caching_config AppsyncResolver#caching_config}
         * @return {@code this}
         */
        public Builder cachingConfig(imports.aws.appsync_resolver.AppsyncResolverCachingConfig cachingConfig) {
            this.cachingConfig = cachingConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getCode}
         * @param code Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#code AppsyncResolver#code}.
         * @return {@code this}
         */
        public Builder code(java.lang.String code) {
            this.code = code;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getDataSource}
         * @param dataSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#data_source AppsyncResolver#data_source}.
         * @return {@code this}
         */
        public Builder dataSource(java.lang.String dataSource) {
            this.dataSource = dataSource;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#id AppsyncResolver#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getKind}
         * @param kind Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#kind AppsyncResolver#kind}.
         * @return {@code this}
         */
        public Builder kind(java.lang.String kind) {
            this.kind = kind;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getMaxBatchSize}
         * @param maxBatchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#max_batch_size AppsyncResolver#max_batch_size}.
         * @return {@code this}
         */
        public Builder maxBatchSize(java.lang.Number maxBatchSize) {
            this.maxBatchSize = maxBatchSize;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getPipelineConfig}
         * @param pipelineConfig pipeline_config block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#pipeline_config AppsyncResolver#pipeline_config}
         * @return {@code this}
         */
        public Builder pipelineConfig(imports.aws.appsync_resolver.AppsyncResolverPipelineConfig pipelineConfig) {
            this.pipelineConfig = pipelineConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getRequestTemplate}
         * @param requestTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#request_template AppsyncResolver#request_template}.
         * @return {@code this}
         */
        public Builder requestTemplate(java.lang.String requestTemplate) {
            this.requestTemplate = requestTemplate;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getResponseTemplate}
         * @param responseTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#response_template AppsyncResolver#response_template}.
         * @return {@code this}
         */
        public Builder responseTemplate(java.lang.String responseTemplate) {
            this.responseTemplate = responseTemplate;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getRuntime}
         * @param runtime runtime block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#runtime AppsyncResolver#runtime}
         * @return {@code this}
         */
        public Builder runtime(imports.aws.appsync_resolver.AppsyncResolverRuntime runtime) {
            this.runtime = runtime;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getSyncConfig}
         * @param syncConfig sync_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#sync_config AppsyncResolver#sync_config}
         * @return {@code this}
         */
        public Builder syncConfig(imports.aws.appsync_resolver.AppsyncResolverSyncConfig syncConfig) {
            this.syncConfig = syncConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getDependsOn}
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
         * Sets the value of {@link AppsyncResolverConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverConfig#getProvisioners}
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
         * @return a new instance of {@link AppsyncResolverConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncResolverConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncResolverConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncResolverConfig {
        private final java.lang.String apiId;
        private final java.lang.String field;
        private final java.lang.String type;
        private final imports.aws.appsync_resolver.AppsyncResolverCachingConfig cachingConfig;
        private final java.lang.String code;
        private final java.lang.String dataSource;
        private final java.lang.String id;
        private final java.lang.String kind;
        private final java.lang.Number maxBatchSize;
        private final imports.aws.appsync_resolver.AppsyncResolverPipelineConfig pipelineConfig;
        private final java.lang.String requestTemplate;
        private final java.lang.String responseTemplate;
        private final imports.aws.appsync_resolver.AppsyncResolverRuntime runtime;
        private final imports.aws.appsync_resolver.AppsyncResolverSyncConfig syncConfig;
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
            this.field = software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cachingConfig = software.amazon.jsii.Kernel.get(this, "cachingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverCachingConfig.class));
            this.code = software.amazon.jsii.Kernel.get(this, "code", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSource = software.amazon.jsii.Kernel.get(this, "dataSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kind = software.amazon.jsii.Kernel.get(this, "kind", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxBatchSize = software.amazon.jsii.Kernel.get(this, "maxBatchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pipelineConfig = software.amazon.jsii.Kernel.get(this, "pipelineConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverPipelineConfig.class));
            this.requestTemplate = software.amazon.jsii.Kernel.get(this, "requestTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.responseTemplate = software.amazon.jsii.Kernel.get(this, "responseTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.runtime = software.amazon.jsii.Kernel.get(this, "runtime", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverRuntime.class));
            this.syncConfig = software.amazon.jsii.Kernel.get(this, "syncConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverSyncConfig.class));
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
            this.field = java.util.Objects.requireNonNull(builder.field, "field is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.cachingConfig = builder.cachingConfig;
            this.code = builder.code;
            this.dataSource = builder.dataSource;
            this.id = builder.id;
            this.kind = builder.kind;
            this.maxBatchSize = builder.maxBatchSize;
            this.pipelineConfig = builder.pipelineConfig;
            this.requestTemplate = builder.requestTemplate;
            this.responseTemplate = builder.responseTemplate;
            this.runtime = builder.runtime;
            this.syncConfig = builder.syncConfig;
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
        public final java.lang.String getField() {
            return this.field;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.appsync_resolver.AppsyncResolverCachingConfig getCachingConfig() {
            return this.cachingConfig;
        }

        @Override
        public final java.lang.String getCode() {
            return this.code;
        }

        @Override
        public final java.lang.String getDataSource() {
            return this.dataSource;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKind() {
            return this.kind;
        }

        @Override
        public final java.lang.Number getMaxBatchSize() {
            return this.maxBatchSize;
        }

        @Override
        public final imports.aws.appsync_resolver.AppsyncResolverPipelineConfig getPipelineConfig() {
            return this.pipelineConfig;
        }

        @Override
        public final java.lang.String getRequestTemplate() {
            return this.requestTemplate;
        }

        @Override
        public final java.lang.String getResponseTemplate() {
            return this.responseTemplate;
        }

        @Override
        public final imports.aws.appsync_resolver.AppsyncResolverRuntime getRuntime() {
            return this.runtime;
        }

        @Override
        public final imports.aws.appsync_resolver.AppsyncResolverSyncConfig getSyncConfig() {
            return this.syncConfig;
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
            data.set("field", om.valueToTree(this.getField()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getCachingConfig() != null) {
                data.set("cachingConfig", om.valueToTree(this.getCachingConfig()));
            }
            if (this.getCode() != null) {
                data.set("code", om.valueToTree(this.getCode()));
            }
            if (this.getDataSource() != null) {
                data.set("dataSource", om.valueToTree(this.getDataSource()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKind() != null) {
                data.set("kind", om.valueToTree(this.getKind()));
            }
            if (this.getMaxBatchSize() != null) {
                data.set("maxBatchSize", om.valueToTree(this.getMaxBatchSize()));
            }
            if (this.getPipelineConfig() != null) {
                data.set("pipelineConfig", om.valueToTree(this.getPipelineConfig()));
            }
            if (this.getRequestTemplate() != null) {
                data.set("requestTemplate", om.valueToTree(this.getRequestTemplate()));
            }
            if (this.getResponseTemplate() != null) {
                data.set("responseTemplate", om.valueToTree(this.getResponseTemplate()));
            }
            if (this.getRuntime() != null) {
                data.set("runtime", om.valueToTree(this.getRuntime()));
            }
            if (this.getSyncConfig() != null) {
                data.set("syncConfig", om.valueToTree(this.getSyncConfig()));
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
            struct.set("fqn", om.valueToTree("aws.appsyncResolver.AppsyncResolverConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncResolverConfig.Jsii$Proxy that = (AppsyncResolverConfig.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!field.equals(that.field)) return false;
            if (!type.equals(that.type)) return false;
            if (this.cachingConfig != null ? !this.cachingConfig.equals(that.cachingConfig) : that.cachingConfig != null) return false;
            if (this.code != null ? !this.code.equals(that.code) : that.code != null) return false;
            if (this.dataSource != null ? !this.dataSource.equals(that.dataSource) : that.dataSource != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kind != null ? !this.kind.equals(that.kind) : that.kind != null) return false;
            if (this.maxBatchSize != null ? !this.maxBatchSize.equals(that.maxBatchSize) : that.maxBatchSize != null) return false;
            if (this.pipelineConfig != null ? !this.pipelineConfig.equals(that.pipelineConfig) : that.pipelineConfig != null) return false;
            if (this.requestTemplate != null ? !this.requestTemplate.equals(that.requestTemplate) : that.requestTemplate != null) return false;
            if (this.responseTemplate != null ? !this.responseTemplate.equals(that.responseTemplate) : that.responseTemplate != null) return false;
            if (this.runtime != null ? !this.runtime.equals(that.runtime) : that.runtime != null) return false;
            if (this.syncConfig != null ? !this.syncConfig.equals(that.syncConfig) : that.syncConfig != null) return false;
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
            result = 31 * result + (this.field.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.cachingConfig != null ? this.cachingConfig.hashCode() : 0);
            result = 31 * result + (this.code != null ? this.code.hashCode() : 0);
            result = 31 * result + (this.dataSource != null ? this.dataSource.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kind != null ? this.kind.hashCode() : 0);
            result = 31 * result + (this.maxBatchSize != null ? this.maxBatchSize.hashCode() : 0);
            result = 31 * result + (this.pipelineConfig != null ? this.pipelineConfig.hashCode() : 0);
            result = 31 * result + (this.requestTemplate != null ? this.requestTemplate.hashCode() : 0);
            result = 31 * result + (this.responseTemplate != null ? this.responseTemplate.hashCode() : 0);
            result = 31 * result + (this.runtime != null ? this.runtime.hashCode() : 0);
            result = 31 * result + (this.syncConfig != null ? this.syncConfig.hashCode() : 0);
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
