package imports.aws.appsync_resolver;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver aws_appsync_resolver}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncResolver.AppsyncResolver")
public class AppsyncResolver extends com.hashicorp.cdktf.TerraformResource {

    protected AppsyncResolver(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncResolver(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.appsync_resolver.AppsyncResolver.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver aws_appsync_resolver} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AppsyncResolver(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AppsyncResolver resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncResolver to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncResolver that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AppsyncResolver to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_resolver.AppsyncResolver.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AppsyncResolver resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncResolver to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncResolver that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_resolver.AppsyncResolver.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCachingConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverCachingConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCachingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPipelineConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverPipelineConfig value) {
        software.amazon.jsii.Kernel.call(this, "putPipelineConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRuntime(final @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverRuntime value) {
        software.amazon.jsii.Kernel.call(this, "putRuntime", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSyncConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverSyncConfig value) {
        software.amazon.jsii.Kernel.call(this, "putSyncConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCachingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCachingConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCode() {
        software.amazon.jsii.Kernel.call(this, "resetCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataSource() {
        software.amazon.jsii.Kernel.call(this, "resetDataSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKind() {
        software.amazon.jsii.Kernel.call(this, "resetKind", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxBatchSize() {
        software.amazon.jsii.Kernel.call(this, "resetMaxBatchSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPipelineConfig() {
        software.amazon.jsii.Kernel.call(this, "resetPipelineConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetRequestTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponseTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetResponseTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuntime() {
        software.amazon.jsii.Kernel.call(this, "resetRuntime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSyncConfig() {
        software.amazon.jsii.Kernel.call(this, "resetSyncConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverCachingConfigOutputReference getCachingConfig() {
        return software.amazon.jsii.Kernel.get(this, "cachingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverCachingConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverPipelineConfigOutputReference getPipelineConfig() {
        return software.amazon.jsii.Kernel.get(this, "pipelineConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverPipelineConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverRuntimeOutputReference getRuntime() {
        return software.amazon.jsii.Kernel.get(this, "runtime", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverRuntimeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_resolver.AppsyncResolverSyncConfigOutputReference getSyncConfig() {
        return software.amazon.jsii.Kernel.get(this, "syncConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverSyncConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "apiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverCachingConfig getCachingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "cachingConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverCachingConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "codeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKindInput() {
        return software.amazon.jsii.Kernel.get(this, "kindInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxBatchSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverPipelineConfig getPipelineConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "pipelineConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverPipelineConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRequestTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "requestTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResponseTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "responseTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverRuntime getRuntimeInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimeInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverRuntime.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverSyncConfig getSyncConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "syncConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverSyncConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiId() {
        return software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiId", java.util.Objects.requireNonNull(value, "apiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCode() {
        return software.amazon.jsii.Kernel.get(this, "code", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "code", java.util.Objects.requireNonNull(value, "code is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSource() {
        return software.amazon.jsii.Kernel.get(this, "dataSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSource", java.util.Objects.requireNonNull(value, "dataSource is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getField() {
        return software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "field", java.util.Objects.requireNonNull(value, "field is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKind() {
        return software.amazon.jsii.Kernel.get(this, "kind", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKind(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kind", java.util.Objects.requireNonNull(value, "kind is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxBatchSize() {
        return software.amazon.jsii.Kernel.get(this, "maxBatchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxBatchSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxBatchSize", java.util.Objects.requireNonNull(value, "maxBatchSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRequestTemplate() {
        return software.amazon.jsii.Kernel.get(this, "requestTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRequestTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "requestTemplate", java.util.Objects.requireNonNull(value, "requestTemplate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResponseTemplate() {
        return software.amazon.jsii.Kernel.get(this, "responseTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResponseTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "responseTemplate", java.util.Objects.requireNonNull(value, "responseTemplate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.appsync_resolver.AppsyncResolver}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.appsync_resolver.AppsyncResolver> {
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
        private final imports.aws.appsync_resolver.AppsyncResolverConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.appsync_resolver.AppsyncResolverConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#api_id AppsyncResolver#api_id}.
         * <p>
         * @return {@code this}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#api_id AppsyncResolver#api_id}. This parameter is required.
         */
        public Builder apiId(final java.lang.String apiId) {
            this.config.apiId(apiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#field AppsyncResolver#field}.
         * <p>
         * @return {@code this}
         * @param field Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#field AppsyncResolver#field}. This parameter is required.
         */
        public Builder field(final java.lang.String field) {
            this.config.field(field);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#type AppsyncResolver#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#type AppsyncResolver#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * caching_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#caching_config AppsyncResolver#caching_config}
         * <p>
         * @return {@code this}
         * @param cachingConfig caching_config block. This parameter is required.
         */
        public Builder cachingConfig(final imports.aws.appsync_resolver.AppsyncResolverCachingConfig cachingConfig) {
            this.config.cachingConfig(cachingConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#code AppsyncResolver#code}.
         * <p>
         * @return {@code this}
         * @param code Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#code AppsyncResolver#code}. This parameter is required.
         */
        public Builder code(final java.lang.String code) {
            this.config.code(code);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#data_source AppsyncResolver#data_source}.
         * <p>
         * @return {@code this}
         * @param dataSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#data_source AppsyncResolver#data_source}. This parameter is required.
         */
        public Builder dataSource(final java.lang.String dataSource) {
            this.config.dataSource(dataSource);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#id AppsyncResolver#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#id AppsyncResolver#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#kind AppsyncResolver#kind}.
         * <p>
         * @return {@code this}
         * @param kind Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#kind AppsyncResolver#kind}. This parameter is required.
         */
        public Builder kind(final java.lang.String kind) {
            this.config.kind(kind);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#max_batch_size AppsyncResolver#max_batch_size}.
         * <p>
         * @return {@code this}
         * @param maxBatchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#max_batch_size AppsyncResolver#max_batch_size}. This parameter is required.
         */
        public Builder maxBatchSize(final java.lang.Number maxBatchSize) {
            this.config.maxBatchSize(maxBatchSize);
            return this;
        }

        /**
         * pipeline_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#pipeline_config AppsyncResolver#pipeline_config}
         * <p>
         * @return {@code this}
         * @param pipelineConfig pipeline_config block. This parameter is required.
         */
        public Builder pipelineConfig(final imports.aws.appsync_resolver.AppsyncResolverPipelineConfig pipelineConfig) {
            this.config.pipelineConfig(pipelineConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#request_template AppsyncResolver#request_template}.
         * <p>
         * @return {@code this}
         * @param requestTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#request_template AppsyncResolver#request_template}. This parameter is required.
         */
        public Builder requestTemplate(final java.lang.String requestTemplate) {
            this.config.requestTemplate(requestTemplate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#response_template AppsyncResolver#response_template}.
         * <p>
         * @return {@code this}
         * @param responseTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#response_template AppsyncResolver#response_template}. This parameter is required.
         */
        public Builder responseTemplate(final java.lang.String responseTemplate) {
            this.config.responseTemplate(responseTemplate);
            return this;
        }

        /**
         * runtime block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#runtime AppsyncResolver#runtime}
         * <p>
         * @return {@code this}
         * @param runtime runtime block. This parameter is required.
         */
        public Builder runtime(final imports.aws.appsync_resolver.AppsyncResolverRuntime runtime) {
            this.config.runtime(runtime);
            return this;
        }

        /**
         * sync_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#sync_config AppsyncResolver#sync_config}
         * <p>
         * @return {@code this}
         * @param syncConfig sync_config block. This parameter is required.
         */
        public Builder syncConfig(final imports.aws.appsync_resolver.AppsyncResolverSyncConfig syncConfig) {
            this.config.syncConfig(syncConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.appsync_resolver.AppsyncResolver}.
         */
        @Override
        public imports.aws.appsync_resolver.AppsyncResolver build() {
            return new imports.aws.appsync_resolver.AppsyncResolver(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
