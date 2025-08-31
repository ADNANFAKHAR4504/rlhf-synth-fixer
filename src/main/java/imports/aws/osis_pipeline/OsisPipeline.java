package imports.aws.osis_pipeline;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline aws_osis_pipeline}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.049Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.osisPipeline.OsisPipeline")
public class OsisPipeline extends com.hashicorp.cdktf.TerraformResource {

    protected OsisPipeline(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OsisPipeline(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.osis_pipeline.OsisPipeline.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline aws_osis_pipeline} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public OsisPipeline(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.osis_pipeline.OsisPipelineConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a OsisPipeline resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OsisPipeline to import. This parameter is required.
     * @param importFromId The id of the existing OsisPipeline that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the OsisPipeline to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.osis_pipeline.OsisPipeline.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a OsisPipeline resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OsisPipeline to import. This parameter is required.
     * @param importFromId The id of the existing OsisPipeline that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.osis_pipeline.OsisPipeline.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putBufferOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.osis_pipeline.OsisPipelineBufferOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.osis_pipeline.OsisPipelineBufferOptions> __cast_cd4240 = (java.util.List<imports.aws.osis_pipeline.OsisPipelineBufferOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.osis_pipeline.OsisPipelineBufferOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBufferOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEncryptionAtRestOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.osis_pipeline.OsisPipelineEncryptionAtRestOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.osis_pipeline.OsisPipelineEncryptionAtRestOptions> __cast_cd4240 = (java.util.List<imports.aws.osis_pipeline.OsisPipelineEncryptionAtRestOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.osis_pipeline.OsisPipelineEncryptionAtRestOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEncryptionAtRestOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogPublishingOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.osis_pipeline.OsisPipelineLogPublishingOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.osis_pipeline.OsisPipelineLogPublishingOptions> __cast_cd4240 = (java.util.List<imports.aws.osis_pipeline.OsisPipelineLogPublishingOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.osis_pipeline.OsisPipelineLogPublishingOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLogPublishingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.osis_pipeline.OsisPipelineTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.osis_pipeline.OsisPipelineVpcOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.osis_pipeline.OsisPipelineVpcOptions> __cast_cd4240 = (java.util.List<imports.aws.osis_pipeline.OsisPipelineVpcOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.osis_pipeline.OsisPipelineVpcOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVpcOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBufferOptions() {
        software.amazon.jsii.Kernel.call(this, "resetBufferOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionAtRestOptions() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionAtRestOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogPublishingOptions() {
        software.amazon.jsii.Kernel.call(this, "resetLogPublishingOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcOptions() {
        software.amazon.jsii.Kernel.call(this, "resetVpcOptions", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.osis_pipeline.OsisPipelineBufferOptionsList getBufferOptions() {
        return software.amazon.jsii.Kernel.get(this, "bufferOptions", software.amazon.jsii.NativeType.forClass(imports.aws.osis_pipeline.OsisPipelineBufferOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.osis_pipeline.OsisPipelineEncryptionAtRestOptionsList getEncryptionAtRestOptions() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAtRestOptions", software.amazon.jsii.NativeType.forClass(imports.aws.osis_pipeline.OsisPipelineEncryptionAtRestOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIngestEndpointUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ingestEndpointUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsList getLogPublishingOptions() {
        return software.amazon.jsii.Kernel.get(this, "logPublishingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPipelineArn() {
        return software.amazon.jsii.Kernel.get(this, "pipelineArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.osis_pipeline.OsisPipelineTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.osis_pipeline.OsisPipelineTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.osis_pipeline.OsisPipelineVpcOptionsList getVpcOptions() {
        return software.amazon.jsii.Kernel.get(this, "vpcOptions", software.amazon.jsii.NativeType.forClass(imports.aws.osis_pipeline.OsisPipelineVpcOptionsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBufferOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionAtRestOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAtRestOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogPublishingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "logPublishingOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "maxUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "minUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPipelineConfigurationBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "pipelineConfigurationBodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPipelineNameInput() {
        return software.amazon.jsii.Kernel.get(this, "pipelineNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVpcOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxUnits() {
        return software.amazon.jsii.Kernel.get(this, "maxUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxUnits", java.util.Objects.requireNonNull(value, "maxUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinUnits() {
        return software.amazon.jsii.Kernel.get(this, "minUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minUnits", java.util.Objects.requireNonNull(value, "minUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPipelineConfigurationBody() {
        return software.amazon.jsii.Kernel.get(this, "pipelineConfigurationBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPipelineConfigurationBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pipelineConfigurationBody", java.util.Objects.requireNonNull(value, "pipelineConfigurationBody is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPipelineName() {
        return software.amazon.jsii.Kernel.get(this, "pipelineName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPipelineName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pipelineName", java.util.Objects.requireNonNull(value, "pipelineName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.osis_pipeline.OsisPipeline}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.osis_pipeline.OsisPipeline> {
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
        private final imports.aws.osis_pipeline.OsisPipelineConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.osis_pipeline.OsisPipelineConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#max_units OsisPipeline#max_units}.
         * <p>
         * @return {@code this}
         * @param maxUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#max_units OsisPipeline#max_units}. This parameter is required.
         */
        public Builder maxUnits(final java.lang.Number maxUnits) {
            this.config.maxUnits(maxUnits);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#min_units OsisPipeline#min_units}.
         * <p>
         * @return {@code this}
         * @param minUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#min_units OsisPipeline#min_units}. This parameter is required.
         */
        public Builder minUnits(final java.lang.Number minUnits) {
            this.config.minUnits(minUnits);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#pipeline_configuration_body OsisPipeline#pipeline_configuration_body}.
         * <p>
         * @return {@code this}
         * @param pipelineConfigurationBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#pipeline_configuration_body OsisPipeline#pipeline_configuration_body}. This parameter is required.
         */
        public Builder pipelineConfigurationBody(final java.lang.String pipelineConfigurationBody) {
            this.config.pipelineConfigurationBody(pipelineConfigurationBody);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#pipeline_name OsisPipeline#pipeline_name}.
         * <p>
         * @return {@code this}
         * @param pipelineName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#pipeline_name OsisPipeline#pipeline_name}. This parameter is required.
         */
        public Builder pipelineName(final java.lang.String pipelineName) {
            this.config.pipelineName(pipelineName);
            return this;
        }

        /**
         * buffer_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#buffer_options OsisPipeline#buffer_options}
         * <p>
         * @return {@code this}
         * @param bufferOptions buffer_options block. This parameter is required.
         */
        public Builder bufferOptions(final com.hashicorp.cdktf.IResolvable bufferOptions) {
            this.config.bufferOptions(bufferOptions);
            return this;
        }
        /**
         * buffer_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#buffer_options OsisPipeline#buffer_options}
         * <p>
         * @return {@code this}
         * @param bufferOptions buffer_options block. This parameter is required.
         */
        public Builder bufferOptions(final java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineBufferOptions> bufferOptions) {
            this.config.bufferOptions(bufferOptions);
            return this;
        }

        /**
         * encryption_at_rest_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#encryption_at_rest_options OsisPipeline#encryption_at_rest_options}
         * <p>
         * @return {@code this}
         * @param encryptionAtRestOptions encryption_at_rest_options block. This parameter is required.
         */
        public Builder encryptionAtRestOptions(final com.hashicorp.cdktf.IResolvable encryptionAtRestOptions) {
            this.config.encryptionAtRestOptions(encryptionAtRestOptions);
            return this;
        }
        /**
         * encryption_at_rest_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#encryption_at_rest_options OsisPipeline#encryption_at_rest_options}
         * <p>
         * @return {@code this}
         * @param encryptionAtRestOptions encryption_at_rest_options block. This parameter is required.
         */
        public Builder encryptionAtRestOptions(final java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineEncryptionAtRestOptions> encryptionAtRestOptions) {
            this.config.encryptionAtRestOptions(encryptionAtRestOptions);
            return this;
        }

        /**
         * log_publishing_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#log_publishing_options OsisPipeline#log_publishing_options}
         * <p>
         * @return {@code this}
         * @param logPublishingOptions log_publishing_options block. This parameter is required.
         */
        public Builder logPublishingOptions(final com.hashicorp.cdktf.IResolvable logPublishingOptions) {
            this.config.logPublishingOptions(logPublishingOptions);
            return this;
        }
        /**
         * log_publishing_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#log_publishing_options OsisPipeline#log_publishing_options}
         * <p>
         * @return {@code this}
         * @param logPublishingOptions log_publishing_options block. This parameter is required.
         */
        public Builder logPublishingOptions(final java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineLogPublishingOptions> logPublishingOptions) {
            this.config.logPublishingOptions(logPublishingOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#tags OsisPipeline#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#tags OsisPipeline#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#timeouts OsisPipeline#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.osis_pipeline.OsisPipelineTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * vpc_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#vpc_options OsisPipeline#vpc_options}
         * <p>
         * @return {@code this}
         * @param vpcOptions vpc_options block. This parameter is required.
         */
        public Builder vpcOptions(final com.hashicorp.cdktf.IResolvable vpcOptions) {
            this.config.vpcOptions(vpcOptions);
            return this;
        }
        /**
         * vpc_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#vpc_options OsisPipeline#vpc_options}
         * <p>
         * @return {@code this}
         * @param vpcOptions vpc_options block. This parameter is required.
         */
        public Builder vpcOptions(final java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineVpcOptions> vpcOptions) {
            this.config.vpcOptions(vpcOptions);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.osis_pipeline.OsisPipeline}.
         */
        @Override
        public imports.aws.osis_pipeline.OsisPipeline build() {
            return new imports.aws.osis_pipeline.OsisPipeline(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
