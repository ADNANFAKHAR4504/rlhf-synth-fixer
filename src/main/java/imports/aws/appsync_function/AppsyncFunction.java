package imports.aws.appsync_function;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function aws_appsync_function}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.070Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncFunction.AppsyncFunction")
public class AppsyncFunction extends com.hashicorp.cdktf.TerraformResource {

    protected AppsyncFunction(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncFunction(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.appsync_function.AppsyncFunction.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function aws_appsync_function} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AppsyncFunction(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.appsync_function.AppsyncFunctionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AppsyncFunction resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncFunction to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncFunction that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AppsyncFunction to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_function.AppsyncFunction.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AppsyncFunction resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncFunction to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncFunction that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_function.AppsyncFunction.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putRuntime(final @org.jetbrains.annotations.NotNull imports.aws.appsync_function.AppsyncFunctionRuntime value) {
        software.amazon.jsii.Kernel.call(this, "putRuntime", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSyncConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_function.AppsyncFunctionSyncConfig value) {
        software.amazon.jsii.Kernel.call(this, "putSyncConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCode() {
        software.amazon.jsii.Kernel.call(this, "resetCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFunctionVersion() {
        software.amazon.jsii.Kernel.call(this, "resetFunctionVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxBatchSize() {
        software.amazon.jsii.Kernel.call(this, "resetMaxBatchSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestMappingTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetRequestMappingTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponseMappingTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetResponseMappingTemplate", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionId() {
        return software.amazon.jsii.Kernel.get(this, "functionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_function.AppsyncFunctionRuntimeOutputReference getRuntime() {
        return software.amazon.jsii.Kernel.get(this, "runtime", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_function.AppsyncFunctionRuntimeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_function.AppsyncFunctionSyncConfigOutputReference getSyncConfig() {
        return software.amazon.jsii.Kernel.get(this, "syncConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_function.AppsyncFunctionSyncConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "apiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "codeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "functionVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxBatchSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRequestMappingTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "requestMappingTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResponseMappingTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "responseMappingTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_function.AppsyncFunctionRuntime getRuntimeInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimeInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_function.AppsyncFunctionRuntime.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_function.AppsyncFunctionSyncConfig getSyncConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "syncConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_function.AppsyncFunctionSyncConfig.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionVersion() {
        return software.amazon.jsii.Kernel.get(this, "functionVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunctionVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "functionVersion", java.util.Objects.requireNonNull(value, "functionVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxBatchSize() {
        return software.amazon.jsii.Kernel.get(this, "maxBatchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxBatchSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxBatchSize", java.util.Objects.requireNonNull(value, "maxBatchSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRequestMappingTemplate() {
        return software.amazon.jsii.Kernel.get(this, "requestMappingTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRequestMappingTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "requestMappingTemplate", java.util.Objects.requireNonNull(value, "requestMappingTemplate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResponseMappingTemplate() {
        return software.amazon.jsii.Kernel.get(this, "responseMappingTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResponseMappingTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "responseMappingTemplate", java.util.Objects.requireNonNull(value, "responseMappingTemplate is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.appsync_function.AppsyncFunction}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.appsync_function.AppsyncFunction> {
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
        private final imports.aws.appsync_function.AppsyncFunctionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.appsync_function.AppsyncFunctionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#api_id AppsyncFunction#api_id}.
         * <p>
         * @return {@code this}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#api_id AppsyncFunction#api_id}. This parameter is required.
         */
        public Builder apiId(final java.lang.String apiId) {
            this.config.apiId(apiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#data_source AppsyncFunction#data_source}.
         * <p>
         * @return {@code this}
         * @param dataSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#data_source AppsyncFunction#data_source}. This parameter is required.
         */
        public Builder dataSource(final java.lang.String dataSource) {
            this.config.dataSource(dataSource);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#name AppsyncFunction#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#name AppsyncFunction#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#code AppsyncFunction#code}.
         * <p>
         * @return {@code this}
         * @param code Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#code AppsyncFunction#code}. This parameter is required.
         */
        public Builder code(final java.lang.String code) {
            this.config.code(code);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#description AppsyncFunction#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#description AppsyncFunction#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#function_version AppsyncFunction#function_version}.
         * <p>
         * @return {@code this}
         * @param functionVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#function_version AppsyncFunction#function_version}. This parameter is required.
         */
        public Builder functionVersion(final java.lang.String functionVersion) {
            this.config.functionVersion(functionVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#id AppsyncFunction#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#id AppsyncFunction#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#max_batch_size AppsyncFunction#max_batch_size}.
         * <p>
         * @return {@code this}
         * @param maxBatchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#max_batch_size AppsyncFunction#max_batch_size}. This parameter is required.
         */
        public Builder maxBatchSize(final java.lang.Number maxBatchSize) {
            this.config.maxBatchSize(maxBatchSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#request_mapping_template AppsyncFunction#request_mapping_template}.
         * <p>
         * @return {@code this}
         * @param requestMappingTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#request_mapping_template AppsyncFunction#request_mapping_template}. This parameter is required.
         */
        public Builder requestMappingTemplate(final java.lang.String requestMappingTemplate) {
            this.config.requestMappingTemplate(requestMappingTemplate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#response_mapping_template AppsyncFunction#response_mapping_template}.
         * <p>
         * @return {@code this}
         * @param responseMappingTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#response_mapping_template AppsyncFunction#response_mapping_template}. This parameter is required.
         */
        public Builder responseMappingTemplate(final java.lang.String responseMappingTemplate) {
            this.config.responseMappingTemplate(responseMappingTemplate);
            return this;
        }

        /**
         * runtime block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#runtime AppsyncFunction#runtime}
         * <p>
         * @return {@code this}
         * @param runtime runtime block. This parameter is required.
         */
        public Builder runtime(final imports.aws.appsync_function.AppsyncFunctionRuntime runtime) {
            this.config.runtime(runtime);
            return this;
        }

        /**
         * sync_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#sync_config AppsyncFunction#sync_config}
         * <p>
         * @return {@code this}
         * @param syncConfig sync_config block. This parameter is required.
         */
        public Builder syncConfig(final imports.aws.appsync_function.AppsyncFunctionSyncConfig syncConfig) {
            this.config.syncConfig(syncConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.appsync_function.AppsyncFunction}.
         */
        @Override
        public imports.aws.appsync_function.AppsyncFunction build() {
            return new imports.aws.appsync_function.AppsyncFunction(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
