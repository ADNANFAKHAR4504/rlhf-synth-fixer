package imports.aws.data_aws_bedrock_foundation_models;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models aws_bedrock_foundation_models}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.482Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsBedrockFoundationModels.DataAwsBedrockFoundationModels")
public class DataAwsBedrockFoundationModels extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsBedrockFoundationModels(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsBedrockFoundationModels(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModels.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models aws_bedrock_foundation_models} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DataAwsBedrockFoundationModels(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModelsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models aws_bedrock_foundation_models} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DataAwsBedrockFoundationModels(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsBedrockFoundationModels resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsBedrockFoundationModels to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsBedrockFoundationModels that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsBedrockFoundationModels to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModels.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsBedrockFoundationModels resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsBedrockFoundationModels to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsBedrockFoundationModels that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModels.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetByCustomizationType() {
        software.amazon.jsii.Kernel.call(this, "resetByCustomizationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetByInferenceType() {
        software.amazon.jsii.Kernel.call(this, "resetByInferenceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetByOutputModality() {
        software.amazon.jsii.Kernel.call(this, "resetByOutputModality", software.amazon.jsii.NativeType.VOID);
    }

    public void resetByProvider() {
        software.amazon.jsii.Kernel.call(this, "resetByProvider", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModelsModelSummariesList getModelSummaries() {
        return software.amazon.jsii.Kernel.get(this, "modelSummaries", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModelsModelSummariesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getByCustomizationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "byCustomizationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getByInferenceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "byInferenceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getByOutputModalityInput() {
        return software.amazon.jsii.Kernel.get(this, "byOutputModalityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getByProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "byProviderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getByCustomizationType() {
        return software.amazon.jsii.Kernel.get(this, "byCustomizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setByCustomizationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "byCustomizationType", java.util.Objects.requireNonNull(value, "byCustomizationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getByInferenceType() {
        return software.amazon.jsii.Kernel.get(this, "byInferenceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setByInferenceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "byInferenceType", java.util.Objects.requireNonNull(value, "byInferenceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getByOutputModality() {
        return software.amazon.jsii.Kernel.get(this, "byOutputModality", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setByOutputModality(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "byOutputModality", java.util.Objects.requireNonNull(value, "byOutputModality is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getByProvider() {
        return software.amazon.jsii.Kernel.get(this, "byProvider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setByProvider(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "byProvider", java.util.Objects.requireNonNull(value, "byProvider is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModels}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModels> {
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
        private imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModelsConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models#by_customization_type DataAwsBedrockFoundationModels#by_customization_type}.
         * <p>
         * @return {@code this}
         * @param byCustomizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models#by_customization_type DataAwsBedrockFoundationModels#by_customization_type}. This parameter is required.
         */
        public Builder byCustomizationType(final java.lang.String byCustomizationType) {
            this.config().byCustomizationType(byCustomizationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models#by_inference_type DataAwsBedrockFoundationModels#by_inference_type}.
         * <p>
         * @return {@code this}
         * @param byInferenceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models#by_inference_type DataAwsBedrockFoundationModels#by_inference_type}. This parameter is required.
         */
        public Builder byInferenceType(final java.lang.String byInferenceType) {
            this.config().byInferenceType(byInferenceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models#by_output_modality DataAwsBedrockFoundationModels#by_output_modality}.
         * <p>
         * @return {@code this}
         * @param byOutputModality Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models#by_output_modality DataAwsBedrockFoundationModels#by_output_modality}. This parameter is required.
         */
        public Builder byOutputModality(final java.lang.String byOutputModality) {
            this.config().byOutputModality(byOutputModality);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models#by_provider DataAwsBedrockFoundationModels#by_provider}.
         * <p>
         * @return {@code this}
         * @param byProvider Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrock_foundation_models#by_provider DataAwsBedrockFoundationModels#by_provider}. This parameter is required.
         */
        public Builder byProvider(final java.lang.String byProvider) {
            this.config().byProvider(byProvider);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModels}.
         */
        @Override
        public imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModels build() {
            return new imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModels(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModelsConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.data_aws_bedrock_foundation_models.DataAwsBedrockFoundationModelsConfig.Builder();
            }
            return this.config;
        }
    }
}
