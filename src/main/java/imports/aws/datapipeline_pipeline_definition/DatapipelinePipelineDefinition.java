package imports.aws.datapipeline_pipeline_definition;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition aws_datapipeline_pipeline_definition}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.939Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datapipelinePipelineDefinition.DatapipelinePipelineDefinition")
public class DatapipelinePipelineDefinition extends com.hashicorp.cdktf.TerraformResource {

    protected DatapipelinePipelineDefinition(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatapipelinePipelineDefinition(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinition.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition aws_datapipeline_pipeline_definition} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DatapipelinePipelineDefinition(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DatapipelinePipelineDefinition resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatapipelinePipelineDefinition to import. This parameter is required.
     * @param importFromId The id of the existing DatapipelinePipelineDefinition that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DatapipelinePipelineDefinition to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinition.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DatapipelinePipelineDefinition resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatapipelinePipelineDefinition to import. This parameter is required.
     * @param importFromId The id of the existing DatapipelinePipelineDefinition that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinition.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putParameterObject(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterObject>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterObject> __cast_cd4240 = (java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterObject>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterObject __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putParameterObject", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putParameterValue(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterValue>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterValue> __cast_cd4240 = (java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterValue>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterValue __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putParameterValue", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPipelineObject(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObject>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObject> __cast_cd4240 = (java.util.List<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObject>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObject __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPipelineObject", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameterObject() {
        software.amazon.jsii.Kernel.call(this, "resetParameterObject", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameterValue() {
        software.amazon.jsii.Kernel.call(this, "resetParameterValue", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterObjectList getParameterObject() {
        return software.amazon.jsii.Kernel.get(this, "parameterObject", software.amazon.jsii.NativeType.forClass(imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterObjectList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterValueList getParameterValue() {
        return software.amazon.jsii.Kernel.get(this, "parameterValue", software.amazon.jsii.NativeType.forClass(imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterValueList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObjectList getPipelineObject() {
        return software.amazon.jsii.Kernel.get(this, "pipelineObject", software.amazon.jsii.NativeType.forClass(imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObjectList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getParameterObjectInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterObjectInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getParameterValueInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPipelineIdInput() {
        return software.amazon.jsii.Kernel.get(this, "pipelineIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPipelineObjectInput() {
        return software.amazon.jsii.Kernel.get(this, "pipelineObjectInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPipelineId() {
        return software.amazon.jsii.Kernel.get(this, "pipelineId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPipelineId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pipelineId", java.util.Objects.requireNonNull(value, "pipelineId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinition}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinition> {
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
        private final imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#pipeline_id DatapipelinePipelineDefinition#pipeline_id}.
         * <p>
         * @return {@code this}
         * @param pipelineId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#pipeline_id DatapipelinePipelineDefinition#pipeline_id}. This parameter is required.
         */
        public Builder pipelineId(final java.lang.String pipelineId) {
            this.config.pipelineId(pipelineId);
            return this;
        }

        /**
         * pipeline_object block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#pipeline_object DatapipelinePipelineDefinition#pipeline_object}
         * <p>
         * @return {@code this}
         * @param pipelineObject pipeline_object block. This parameter is required.
         */
        public Builder pipelineObject(final com.hashicorp.cdktf.IResolvable pipelineObject) {
            this.config.pipelineObject(pipelineObject);
            return this;
        }
        /**
         * pipeline_object block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#pipeline_object DatapipelinePipelineDefinition#pipeline_object}
         * <p>
         * @return {@code this}
         * @param pipelineObject pipeline_object block. This parameter is required.
         */
        public Builder pipelineObject(final java.util.List<? extends imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObject> pipelineObject) {
            this.config.pipelineObject(pipelineObject);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#id DatapipelinePipelineDefinition#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#id DatapipelinePipelineDefinition#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * parameter_object block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#parameter_object DatapipelinePipelineDefinition#parameter_object}
         * <p>
         * @return {@code this}
         * @param parameterObject parameter_object block. This parameter is required.
         */
        public Builder parameterObject(final com.hashicorp.cdktf.IResolvable parameterObject) {
            this.config.parameterObject(parameterObject);
            return this;
        }
        /**
         * parameter_object block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#parameter_object DatapipelinePipelineDefinition#parameter_object}
         * <p>
         * @return {@code this}
         * @param parameterObject parameter_object block. This parameter is required.
         */
        public Builder parameterObject(final java.util.List<? extends imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterObject> parameterObject) {
            this.config.parameterObject(parameterObject);
            return this;
        }

        /**
         * parameter_value block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#parameter_value DatapipelinePipelineDefinition#parameter_value}
         * <p>
         * @return {@code this}
         * @param parameterValue parameter_value block. This parameter is required.
         */
        public Builder parameterValue(final com.hashicorp.cdktf.IResolvable parameterValue) {
            this.config.parameterValue(parameterValue);
            return this;
        }
        /**
         * parameter_value block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#parameter_value DatapipelinePipelineDefinition#parameter_value}
         * <p>
         * @return {@code this}
         * @param parameterValue parameter_value block. This parameter is required.
         */
        public Builder parameterValue(final java.util.List<? extends imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterValue> parameterValue) {
            this.config.parameterValue(parameterValue);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinition}.
         */
        @Override
        public imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinition build() {
            return new imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinition(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
