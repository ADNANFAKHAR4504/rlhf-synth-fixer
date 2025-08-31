package imports.aws.appsync_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.070Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncFunction.AppsyncFunctionConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncFunctionConfig.Jsii$Proxy.class)
public interface AppsyncFunctionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#api_id AppsyncFunction#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#data_source AppsyncFunction#data_source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#name AppsyncFunction#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#code AppsyncFunction#code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#description AppsyncFunction#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#function_version AppsyncFunction#function_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFunctionVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#id AppsyncFunction#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#max_batch_size AppsyncFunction#max_batch_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxBatchSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#request_mapping_template AppsyncFunction#request_mapping_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRequestMappingTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#response_mapping_template AppsyncFunction#response_mapping_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResponseMappingTemplate() {
        return null;
    }

    /**
     * runtime block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#runtime AppsyncFunction#runtime}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_function.AppsyncFunctionRuntime getRuntime() {
        return null;
    }

    /**
     * sync_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#sync_config AppsyncFunction#sync_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_function.AppsyncFunctionSyncConfig getSyncConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncFunctionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncFunctionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncFunctionConfig> {
        java.lang.String apiId;
        java.lang.String dataSource;
        java.lang.String name;
        java.lang.String code;
        java.lang.String description;
        java.lang.String functionVersion;
        java.lang.String id;
        java.lang.Number maxBatchSize;
        java.lang.String requestMappingTemplate;
        java.lang.String responseMappingTemplate;
        imports.aws.appsync_function.AppsyncFunctionRuntime runtime;
        imports.aws.appsync_function.AppsyncFunctionSyncConfig syncConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#api_id AppsyncFunction#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getDataSource}
         * @param dataSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#data_source AppsyncFunction#data_source}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSource(java.lang.String dataSource) {
            this.dataSource = dataSource;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#name AppsyncFunction#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getCode}
         * @param code Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#code AppsyncFunction#code}.
         * @return {@code this}
         */
        public Builder code(java.lang.String code) {
            this.code = code;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#description AppsyncFunction#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getFunctionVersion}
         * @param functionVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#function_version AppsyncFunction#function_version}.
         * @return {@code this}
         */
        public Builder functionVersion(java.lang.String functionVersion) {
            this.functionVersion = functionVersion;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#id AppsyncFunction#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getMaxBatchSize}
         * @param maxBatchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#max_batch_size AppsyncFunction#max_batch_size}.
         * @return {@code this}
         */
        public Builder maxBatchSize(java.lang.Number maxBatchSize) {
            this.maxBatchSize = maxBatchSize;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getRequestMappingTemplate}
         * @param requestMappingTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#request_mapping_template AppsyncFunction#request_mapping_template}.
         * @return {@code this}
         */
        public Builder requestMappingTemplate(java.lang.String requestMappingTemplate) {
            this.requestMappingTemplate = requestMappingTemplate;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getResponseMappingTemplate}
         * @param responseMappingTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#response_mapping_template AppsyncFunction#response_mapping_template}.
         * @return {@code this}
         */
        public Builder responseMappingTemplate(java.lang.String responseMappingTemplate) {
            this.responseMappingTemplate = responseMappingTemplate;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getRuntime}
         * @param runtime runtime block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#runtime AppsyncFunction#runtime}
         * @return {@code this}
         */
        public Builder runtime(imports.aws.appsync_function.AppsyncFunctionRuntime runtime) {
            this.runtime = runtime;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getSyncConfig}
         * @param syncConfig sync_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#sync_config AppsyncFunction#sync_config}
         * @return {@code this}
         */
        public Builder syncConfig(imports.aws.appsync_function.AppsyncFunctionSyncConfig syncConfig) {
            this.syncConfig = syncConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getDependsOn}
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
         * Sets the value of {@link AppsyncFunctionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionConfig#getProvisioners}
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
         * @return a new instance of {@link AppsyncFunctionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncFunctionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncFunctionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncFunctionConfig {
        private final java.lang.String apiId;
        private final java.lang.String dataSource;
        private final java.lang.String name;
        private final java.lang.String code;
        private final java.lang.String description;
        private final java.lang.String functionVersion;
        private final java.lang.String id;
        private final java.lang.Number maxBatchSize;
        private final java.lang.String requestMappingTemplate;
        private final java.lang.String responseMappingTemplate;
        private final imports.aws.appsync_function.AppsyncFunctionRuntime runtime;
        private final imports.aws.appsync_function.AppsyncFunctionSyncConfig syncConfig;
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
            this.dataSource = software.amazon.jsii.Kernel.get(this, "dataSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.code = software.amazon.jsii.Kernel.get(this, "code", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.functionVersion = software.amazon.jsii.Kernel.get(this, "functionVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxBatchSize = software.amazon.jsii.Kernel.get(this, "maxBatchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.requestMappingTemplate = software.amazon.jsii.Kernel.get(this, "requestMappingTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.responseMappingTemplate = software.amazon.jsii.Kernel.get(this, "responseMappingTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.runtime = software.amazon.jsii.Kernel.get(this, "runtime", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_function.AppsyncFunctionRuntime.class));
            this.syncConfig = software.amazon.jsii.Kernel.get(this, "syncConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_function.AppsyncFunctionSyncConfig.class));
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
            this.dataSource = java.util.Objects.requireNonNull(builder.dataSource, "dataSource is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.code = builder.code;
            this.description = builder.description;
            this.functionVersion = builder.functionVersion;
            this.id = builder.id;
            this.maxBatchSize = builder.maxBatchSize;
            this.requestMappingTemplate = builder.requestMappingTemplate;
            this.responseMappingTemplate = builder.responseMappingTemplate;
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
        public final java.lang.String getDataSource() {
            return this.dataSource;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getCode() {
            return this.code;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getFunctionVersion() {
            return this.functionVersion;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMaxBatchSize() {
            return this.maxBatchSize;
        }

        @Override
        public final java.lang.String getRequestMappingTemplate() {
            return this.requestMappingTemplate;
        }

        @Override
        public final java.lang.String getResponseMappingTemplate() {
            return this.responseMappingTemplate;
        }

        @Override
        public final imports.aws.appsync_function.AppsyncFunctionRuntime getRuntime() {
            return this.runtime;
        }

        @Override
        public final imports.aws.appsync_function.AppsyncFunctionSyncConfig getSyncConfig() {
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
            data.set("dataSource", om.valueToTree(this.getDataSource()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCode() != null) {
                data.set("code", om.valueToTree(this.getCode()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getFunctionVersion() != null) {
                data.set("functionVersion", om.valueToTree(this.getFunctionVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaxBatchSize() != null) {
                data.set("maxBatchSize", om.valueToTree(this.getMaxBatchSize()));
            }
            if (this.getRequestMappingTemplate() != null) {
                data.set("requestMappingTemplate", om.valueToTree(this.getRequestMappingTemplate()));
            }
            if (this.getResponseMappingTemplate() != null) {
                data.set("responseMappingTemplate", om.valueToTree(this.getResponseMappingTemplate()));
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
            struct.set("fqn", om.valueToTree("aws.appsyncFunction.AppsyncFunctionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncFunctionConfig.Jsii$Proxy that = (AppsyncFunctionConfig.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!dataSource.equals(that.dataSource)) return false;
            if (!name.equals(that.name)) return false;
            if (this.code != null ? !this.code.equals(that.code) : that.code != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.functionVersion != null ? !this.functionVersion.equals(that.functionVersion) : that.functionVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.maxBatchSize != null ? !this.maxBatchSize.equals(that.maxBatchSize) : that.maxBatchSize != null) return false;
            if (this.requestMappingTemplate != null ? !this.requestMappingTemplate.equals(that.requestMappingTemplate) : that.requestMappingTemplate != null) return false;
            if (this.responseMappingTemplate != null ? !this.responseMappingTemplate.equals(that.responseMappingTemplate) : that.responseMappingTemplate != null) return false;
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
            result = 31 * result + (this.dataSource.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.code != null ? this.code.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.functionVersion != null ? this.functionVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maxBatchSize != null ? this.maxBatchSize.hashCode() : 0);
            result = 31 * result + (this.requestMappingTemplate != null ? this.requestMappingTemplate.hashCode() : 0);
            result = 31 * result + (this.responseMappingTemplate != null ? this.responseMappingTemplate.hashCode() : 0);
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
