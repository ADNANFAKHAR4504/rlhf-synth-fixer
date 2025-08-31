package imports.aws.kinesis_analytics_application;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application aws_kinesis_analytics_application}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.442Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplication")
public class KinesisAnalyticsApplication extends com.hashicorp.cdktf.TerraformResource {

    protected KinesisAnalyticsApplication(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisAnalyticsApplication(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplication.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application aws_kinesis_analytics_application} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public KinesisAnalyticsApplication(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a KinesisAnalyticsApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KinesisAnalyticsApplication to import. This parameter is required.
     * @param importFromId The id of the existing KinesisAnalyticsApplication that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the KinesisAnalyticsApplication to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a KinesisAnalyticsApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KinesisAnalyticsApplication to import. This parameter is required.
     * @param importFromId The id of the existing KinesisAnalyticsApplication that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCloudwatchLoggingOptions(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationCloudwatchLoggingOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLoggingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInputs(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputs value) {
        software.amazon.jsii.Kernel.call(this, "putInputs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOutputs(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputs>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputs> __cast_cd4240 = (java.util.List<imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputs>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputs __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOutputs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putReferenceDataSources(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSources value) {
        software.amazon.jsii.Kernel.call(this, "putReferenceDataSources", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLoggingOptions() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLoggingOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCode() {
        software.amazon.jsii.Kernel.call(this, "resetCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputs() {
        software.amazon.jsii.Kernel.call(this, "resetInputs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputs() {
        software.amazon.jsii.Kernel.call(this, "resetOutputs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReferenceDataSources() {
        software.amazon.jsii.Kernel.call(this, "resetReferenceDataSources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartApplication() {
        software.amazon.jsii.Kernel.call(this, "resetStartApplication", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationCloudwatchLoggingOptionsOutputReference getCloudwatchLoggingOptions() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationCloudwatchLoggingOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreateTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "createTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsOutputReference getInputs() {
        return software.amazon.jsii.Kernel.get(this, "inputs", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastUpdateTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdateTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsList getOutputs() {
        return software.amazon.jsii.Kernel.get(this, "outputs", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesOutputReference getReferenceDataSources() {
        return software.amazon.jsii.Kernel.get(this, "referenceDataSources", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationCloudwatchLoggingOptions getCloudwatchLoggingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationCloudwatchLoggingOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "codeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputs getInputsInput() {
        return software.amazon.jsii.Kernel.get(this, "inputsInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputs.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOutputsInput() {
        return software.amazon.jsii.Kernel.get(this, "outputsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSources getReferenceDataSourcesInput() {
        return software.amazon.jsii.Kernel.get(this, "referenceDataSourcesInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSources.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStartApplicationInput() {
        return software.amazon.jsii.Kernel.get(this, "startApplicationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCode() {
        return software.amazon.jsii.Kernel.get(this, "code", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "code", java.util.Objects.requireNonNull(value, "code is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStartApplication() {
        return software.amazon.jsii.Kernel.get(this, "startApplication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStartApplication(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "startApplication", java.util.Objects.requireNonNull(value, "startApplication is required"));
    }

    public void setStartApplication(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "startApplication", java.util.Objects.requireNonNull(value, "startApplication is required"));
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
     * A fluent builder for {@link imports.aws.kinesis_analytics_application.KinesisAnalyticsApplication}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.kinesis_analytics_application.KinesisAnalyticsApplication> {
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
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#name KinesisAnalyticsApplication#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#name KinesisAnalyticsApplication#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * cloudwatch_logging_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#cloudwatch_logging_options KinesisAnalyticsApplication#cloudwatch_logging_options}
         * <p>
         * @return {@code this}
         * @param cloudwatchLoggingOptions cloudwatch_logging_options block. This parameter is required.
         */
        public Builder cloudwatchLoggingOptions(final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationCloudwatchLoggingOptions cloudwatchLoggingOptions) {
            this.config.cloudwatchLoggingOptions(cloudwatchLoggingOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#code KinesisAnalyticsApplication#code}.
         * <p>
         * @return {@code this}
         * @param code Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#code KinesisAnalyticsApplication#code}. This parameter is required.
         */
        public Builder code(final java.lang.String code) {
            this.config.code(code);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#description KinesisAnalyticsApplication#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#description KinesisAnalyticsApplication#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#id KinesisAnalyticsApplication#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#id KinesisAnalyticsApplication#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * inputs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#inputs KinesisAnalyticsApplication#inputs}
         * <p>
         * @return {@code this}
         * @param inputs inputs block. This parameter is required.
         */
        public Builder inputs(final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputs inputs) {
            this.config.inputs(inputs);
            return this;
        }

        /**
         * outputs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#outputs KinesisAnalyticsApplication#outputs}
         * <p>
         * @return {@code this}
         * @param outputs outputs block. This parameter is required.
         */
        public Builder outputs(final com.hashicorp.cdktf.IResolvable outputs) {
            this.config.outputs(outputs);
            return this;
        }
        /**
         * outputs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#outputs KinesisAnalyticsApplication#outputs}
         * <p>
         * @return {@code this}
         * @param outputs outputs block. This parameter is required.
         */
        public Builder outputs(final java.util.List<? extends imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputs> outputs) {
            this.config.outputs(outputs);
            return this;
        }

        /**
         * reference_data_sources block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#reference_data_sources KinesisAnalyticsApplication#reference_data_sources}
         * <p>
         * @return {@code this}
         * @param referenceDataSources reference_data_sources block. This parameter is required.
         */
        public Builder referenceDataSources(final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSources referenceDataSources) {
            this.config.referenceDataSources(referenceDataSources);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#start_application KinesisAnalyticsApplication#start_application}.
         * <p>
         * @return {@code this}
         * @param startApplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#start_application KinesisAnalyticsApplication#start_application}. This parameter is required.
         */
        public Builder startApplication(final java.lang.Boolean startApplication) {
            this.config.startApplication(startApplication);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#start_application KinesisAnalyticsApplication#start_application}.
         * <p>
         * @return {@code this}
         * @param startApplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#start_application KinesisAnalyticsApplication#start_application}. This parameter is required.
         */
        public Builder startApplication(final com.hashicorp.cdktf.IResolvable startApplication) {
            this.config.startApplication(startApplication);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#tags KinesisAnalyticsApplication#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#tags KinesisAnalyticsApplication#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#tags_all KinesisAnalyticsApplication#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#tags_all KinesisAnalyticsApplication#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.kinesis_analytics_application.KinesisAnalyticsApplication}.
         */
        @Override
        public imports.aws.kinesis_analytics_application.KinesisAnalyticsApplication build() {
            return new imports.aws.kinesis_analytics_application.KinesisAnalyticsApplication(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
