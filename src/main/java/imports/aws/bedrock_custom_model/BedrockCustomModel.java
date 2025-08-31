package imports.aws.bedrock_custom_model;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model aws_bedrock_custom_model}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.138Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockCustomModel.BedrockCustomModel")
public class BedrockCustomModel extends com.hashicorp.cdktf.TerraformResource {

    protected BedrockCustomModel(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockCustomModel(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.bedrock_custom_model.BedrockCustomModel.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model aws_bedrock_custom_model} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BedrockCustomModel(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BedrockCustomModel resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockCustomModel to import. This parameter is required.
     * @param importFromId The id of the existing BedrockCustomModel that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BedrockCustomModel to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrock_custom_model.BedrockCustomModel.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BedrockCustomModel resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockCustomModel to import. This parameter is required.
     * @param importFromId The id of the existing BedrockCustomModel that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrock_custom_model.BedrockCustomModel.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putOutputDataConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelOutputDataConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelOutputDataConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelOutputDataConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_custom_model.BedrockCustomModelOutputDataConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOutputDataConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTrainingDataConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelTrainingDataConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelTrainingDataConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelTrainingDataConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_custom_model.BedrockCustomModelTrainingDataConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTrainingDataConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putValidationDataConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putValidationDataConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelVpcConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelVpcConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_custom_model.BedrockCustomModelVpcConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_custom_model.BedrockCustomModelVpcConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomizationType() {
        software.amazon.jsii.Kernel.call(this, "resetCustomizationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomModelKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetCustomModelKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputDataConfig() {
        software.amazon.jsii.Kernel.call(this, "resetOutputDataConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrainingDataConfig() {
        software.amazon.jsii.Kernel.call(this, "resetTrainingDataConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValidationDataConfig() {
        software.amazon.jsii.Kernel.call(this, "resetValidationDataConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomModelArn() {
        return software.amazon.jsii.Kernel.get(this, "customModelArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobArn() {
        return software.amazon.jsii.Kernel.get(this, "jobArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobStatus() {
        return software.amazon.jsii.Kernel.get(this, "jobStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelOutputDataConfigList getOutputDataConfig() {
        return software.amazon.jsii.Kernel.get(this, "outputDataConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_custom_model.BedrockCustomModelOutputDataConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_custom_model.BedrockCustomModelTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelTrainingDataConfigList getTrainingDataConfig() {
        return software.amazon.jsii.Kernel.get(this, "trainingDataConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_custom_model.BedrockCustomModelTrainingDataConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelTrainingMetricsList getTrainingMetrics() {
        return software.amazon.jsii.Kernel.get(this, "trainingMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_custom_model.BedrockCustomModelTrainingMetricsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfigList getValidationDataConfig() {
        return software.amazon.jsii.Kernel.get(this, "validationDataConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelValidationMetricsList getValidationMetrics() {
        return software.amazon.jsii.Kernel.get(this, "validationMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_custom_model.BedrockCustomModelValidationMetricsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_custom_model.BedrockCustomModelVpcConfigList getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_custom_model.BedrockCustomModelVpcConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBaseModelIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "baseModelIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomizationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "customizationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomModelKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "customModelKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomModelNameInput() {
        return software.amazon.jsii.Kernel.get(this, "customModelNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getHyperparametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "hyperparametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobNameInput() {
        return software.amazon.jsii.Kernel.get(this, "jobNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOutputDataConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "outputDataConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTrainingDataConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "trainingDataConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getValidationDataConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "validationDataConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBaseModelIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "baseModelIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBaseModelIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "baseModelIdentifier", java.util.Objects.requireNonNull(value, "baseModelIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomizationType() {
        return software.amazon.jsii.Kernel.get(this, "customizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomizationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customizationType", java.util.Objects.requireNonNull(value, "customizationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomModelKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "customModelKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomModelKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customModelKmsKeyId", java.util.Objects.requireNonNull(value, "customModelKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomModelName() {
        return software.amazon.jsii.Kernel.get(this, "customModelName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomModelName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customModelName", java.util.Objects.requireNonNull(value, "customModelName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getHyperparameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "hyperparameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHyperparameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "hyperparameters", java.util.Objects.requireNonNull(value, "hyperparameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobName() {
        return software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobName", java.util.Objects.requireNonNull(value, "jobName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.bedrock_custom_model.BedrockCustomModel}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.bedrock_custom_model.BedrockCustomModel> {
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
        private final imports.aws.bedrock_custom_model.BedrockCustomModelConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.bedrock_custom_model.BedrockCustomModelConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#base_model_identifier BedrockCustomModel#base_model_identifier}.
         * <p>
         * @return {@code this}
         * @param baseModelIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#base_model_identifier BedrockCustomModel#base_model_identifier}. This parameter is required.
         */
        public Builder baseModelIdentifier(final java.lang.String baseModelIdentifier) {
            this.config.baseModelIdentifier(baseModelIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#custom_model_name BedrockCustomModel#custom_model_name}.
         * <p>
         * @return {@code this}
         * @param customModelName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#custom_model_name BedrockCustomModel#custom_model_name}. This parameter is required.
         */
        public Builder customModelName(final java.lang.String customModelName) {
            this.config.customModelName(customModelName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#hyperparameters BedrockCustomModel#hyperparameters}.
         * <p>
         * @return {@code this}
         * @param hyperparameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#hyperparameters BedrockCustomModel#hyperparameters}. This parameter is required.
         */
        public Builder hyperparameters(final java.util.Map<java.lang.String, java.lang.String> hyperparameters) {
            this.config.hyperparameters(hyperparameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#job_name BedrockCustomModel#job_name}.
         * <p>
         * @return {@code this}
         * @param jobName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#job_name BedrockCustomModel#job_name}. This parameter is required.
         */
        public Builder jobName(final java.lang.String jobName) {
            this.config.jobName(jobName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#role_arn BedrockCustomModel#role_arn}.
         * <p>
         * @return {@code this}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#role_arn BedrockCustomModel#role_arn}. This parameter is required.
         */
        public Builder roleArn(final java.lang.String roleArn) {
            this.config.roleArn(roleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#customization_type BedrockCustomModel#customization_type}.
         * <p>
         * @return {@code this}
         * @param customizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#customization_type BedrockCustomModel#customization_type}. This parameter is required.
         */
        public Builder customizationType(final java.lang.String customizationType) {
            this.config.customizationType(customizationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#custom_model_kms_key_id BedrockCustomModel#custom_model_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param customModelKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#custom_model_kms_key_id BedrockCustomModel#custom_model_kms_key_id}. This parameter is required.
         */
        public Builder customModelKmsKeyId(final java.lang.String customModelKmsKeyId) {
            this.config.customModelKmsKeyId(customModelKmsKeyId);
            return this;
        }

        /**
         * output_data_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#output_data_config BedrockCustomModel#output_data_config}
         * <p>
         * @return {@code this}
         * @param outputDataConfig output_data_config block. This parameter is required.
         */
        public Builder outputDataConfig(final com.hashicorp.cdktf.IResolvable outputDataConfig) {
            this.config.outputDataConfig(outputDataConfig);
            return this;
        }
        /**
         * output_data_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#output_data_config BedrockCustomModel#output_data_config}
         * <p>
         * @return {@code this}
         * @param outputDataConfig output_data_config block. This parameter is required.
         */
        public Builder outputDataConfig(final java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelOutputDataConfig> outputDataConfig) {
            this.config.outputDataConfig(outputDataConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#tags BedrockCustomModel#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#tags BedrockCustomModel#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#timeouts BedrockCustomModel#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.bedrock_custom_model.BedrockCustomModelTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * training_data_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#training_data_config BedrockCustomModel#training_data_config}
         * <p>
         * @return {@code this}
         * @param trainingDataConfig training_data_config block. This parameter is required.
         */
        public Builder trainingDataConfig(final com.hashicorp.cdktf.IResolvable trainingDataConfig) {
            this.config.trainingDataConfig(trainingDataConfig);
            return this;
        }
        /**
         * training_data_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#training_data_config BedrockCustomModel#training_data_config}
         * <p>
         * @return {@code this}
         * @param trainingDataConfig training_data_config block. This parameter is required.
         */
        public Builder trainingDataConfig(final java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelTrainingDataConfig> trainingDataConfig) {
            this.config.trainingDataConfig(trainingDataConfig);
            return this;
        }

        /**
         * validation_data_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#validation_data_config BedrockCustomModel#validation_data_config}
         * <p>
         * @return {@code this}
         * @param validationDataConfig validation_data_config block. This parameter is required.
         */
        public Builder validationDataConfig(final com.hashicorp.cdktf.IResolvable validationDataConfig) {
            this.config.validationDataConfig(validationDataConfig);
            return this;
        }
        /**
         * validation_data_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#validation_data_config BedrockCustomModel#validation_data_config}
         * <p>
         * @return {@code this}
         * @param validationDataConfig validation_data_config block. This parameter is required.
         */
        public Builder validationDataConfig(final java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfig> validationDataConfig) {
            this.config.validationDataConfig(validationDataConfig);
            return this;
        }

        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#vpc_config BedrockCustomModel#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final com.hashicorp.cdktf.IResolvable vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }
        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#vpc_config BedrockCustomModel#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelVpcConfig> vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.bedrock_custom_model.BedrockCustomModel}.
         */
        @Override
        public imports.aws.bedrock_custom_model.BedrockCustomModel build() {
            return new imports.aws.bedrock_custom_model.BedrockCustomModel(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
