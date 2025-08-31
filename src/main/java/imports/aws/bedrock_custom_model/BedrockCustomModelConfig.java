package imports.aws.bedrock_custom_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockCustomModel.BedrockCustomModelConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockCustomModelConfig.Jsii$Proxy.class)
public interface BedrockCustomModelConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#base_model_identifier BedrockCustomModel#base_model_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBaseModelIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#custom_model_name BedrockCustomModel#custom_model_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomModelName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#hyperparameters BedrockCustomModel#hyperparameters}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getHyperparameters();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#job_name BedrockCustomModel#job_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getJobName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#role_arn BedrockCustomModel#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#customization_type BedrockCustomModel#customization_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomizationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#custom_model_kms_key_id BedrockCustomModel#custom_model_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomModelKmsKeyId() {
        return null;
    }

    /**
     * output_data_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#output_data_config BedrockCustomModel#output_data_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOutputDataConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#tags BedrockCustomModel#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#timeouts BedrockCustomModel#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrock_custom_model.BedrockCustomModelTimeouts getTimeouts() {
        return null;
    }

    /**
     * training_data_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#training_data_config BedrockCustomModel#training_data_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTrainingDataConfig() {
        return null;
    }

    /**
     * validation_data_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#validation_data_config BedrockCustomModel#validation_data_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getValidationDataConfig() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#vpc_config BedrockCustomModel#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockCustomModelConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockCustomModelConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockCustomModelConfig> {
        java.lang.String baseModelIdentifier;
        java.lang.String customModelName;
        java.util.Map<java.lang.String, java.lang.String> hyperparameters;
        java.lang.String jobName;
        java.lang.String roleArn;
        java.lang.String customizationType;
        java.lang.String customModelKmsKeyId;
        java.lang.Object outputDataConfig;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.bedrock_custom_model.BedrockCustomModelTimeouts timeouts;
        java.lang.Object trainingDataConfig;
        java.lang.Object validationDataConfig;
        java.lang.Object vpcConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getBaseModelIdentifier}
         * @param baseModelIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#base_model_identifier BedrockCustomModel#base_model_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder baseModelIdentifier(java.lang.String baseModelIdentifier) {
            this.baseModelIdentifier = baseModelIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getCustomModelName}
         * @param customModelName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#custom_model_name BedrockCustomModel#custom_model_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder customModelName(java.lang.String customModelName) {
            this.customModelName = customModelName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getHyperparameters}
         * @param hyperparameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#hyperparameters BedrockCustomModel#hyperparameters}. This parameter is required.
         * @return {@code this}
         */
        public Builder hyperparameters(java.util.Map<java.lang.String, java.lang.String> hyperparameters) {
            this.hyperparameters = hyperparameters;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getJobName}
         * @param jobName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#job_name BedrockCustomModel#job_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder jobName(java.lang.String jobName) {
            this.jobName = jobName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#role_arn BedrockCustomModel#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getCustomizationType}
         * @param customizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#customization_type BedrockCustomModel#customization_type}.
         * @return {@code this}
         */
        public Builder customizationType(java.lang.String customizationType) {
            this.customizationType = customizationType;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getCustomModelKmsKeyId}
         * @param customModelKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#custom_model_kms_key_id BedrockCustomModel#custom_model_kms_key_id}.
         * @return {@code this}
         */
        public Builder customModelKmsKeyId(java.lang.String customModelKmsKeyId) {
            this.customModelKmsKeyId = customModelKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getOutputDataConfig}
         * @param outputDataConfig output_data_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#output_data_config BedrockCustomModel#output_data_config}
         * @return {@code this}
         */
        public Builder outputDataConfig(com.hashicorp.cdktf.IResolvable outputDataConfig) {
            this.outputDataConfig = outputDataConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getOutputDataConfig}
         * @param outputDataConfig output_data_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#output_data_config BedrockCustomModel#output_data_config}
         * @return {@code this}
         */
        public Builder outputDataConfig(java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelOutputDataConfig> outputDataConfig) {
            this.outputDataConfig = outputDataConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#tags BedrockCustomModel#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#timeouts BedrockCustomModel#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.bedrock_custom_model.BedrockCustomModelTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getTrainingDataConfig}
         * @param trainingDataConfig training_data_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#training_data_config BedrockCustomModel#training_data_config}
         * @return {@code this}
         */
        public Builder trainingDataConfig(com.hashicorp.cdktf.IResolvable trainingDataConfig) {
            this.trainingDataConfig = trainingDataConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getTrainingDataConfig}
         * @param trainingDataConfig training_data_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#training_data_config BedrockCustomModel#training_data_config}
         * @return {@code this}
         */
        public Builder trainingDataConfig(java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelTrainingDataConfig> trainingDataConfig) {
            this.trainingDataConfig = trainingDataConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getValidationDataConfig}
         * @param validationDataConfig validation_data_config block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#validation_data_config BedrockCustomModel#validation_data_config}
         * @return {@code this}
         */
        public Builder validationDataConfig(com.hashicorp.cdktf.IResolvable validationDataConfig) {
            this.validationDataConfig = validationDataConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getValidationDataConfig}
         * @param validationDataConfig validation_data_config block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#validation_data_config BedrockCustomModel#validation_data_config}
         * @return {@code this}
         */
        public Builder validationDataConfig(java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfig> validationDataConfig) {
            this.validationDataConfig = validationDataConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#vpc_config BedrockCustomModel#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(com.hashicorp.cdktf.IResolvable vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#vpc_config BedrockCustomModel#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelVpcConfig> vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getDependsOn}
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
         * Sets the value of {@link BedrockCustomModelConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelConfig#getProvisioners}
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
         * @return a new instance of {@link BedrockCustomModelConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockCustomModelConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockCustomModelConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockCustomModelConfig {
        private final java.lang.String baseModelIdentifier;
        private final java.lang.String customModelName;
        private final java.util.Map<java.lang.String, java.lang.String> hyperparameters;
        private final java.lang.String jobName;
        private final java.lang.String roleArn;
        private final java.lang.String customizationType;
        private final java.lang.String customModelKmsKeyId;
        private final java.lang.Object outputDataConfig;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.bedrock_custom_model.BedrockCustomModelTimeouts timeouts;
        private final java.lang.Object trainingDataConfig;
        private final java.lang.Object validationDataConfig;
        private final java.lang.Object vpcConfig;
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
            this.baseModelIdentifier = software.amazon.jsii.Kernel.get(this, "baseModelIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customModelName = software.amazon.jsii.Kernel.get(this, "customModelName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hyperparameters = software.amazon.jsii.Kernel.get(this, "hyperparameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.jobName = software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customizationType = software.amazon.jsii.Kernel.get(this, "customizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customModelKmsKeyId = software.amazon.jsii.Kernel.get(this, "customModelKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputDataConfig = software.amazon.jsii.Kernel.get(this, "outputDataConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_custom_model.BedrockCustomModelTimeouts.class));
            this.trainingDataConfig = software.amazon.jsii.Kernel.get(this, "trainingDataConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.validationDataConfig = software.amazon.jsii.Kernel.get(this, "validationDataConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.baseModelIdentifier = java.util.Objects.requireNonNull(builder.baseModelIdentifier, "baseModelIdentifier is required");
            this.customModelName = java.util.Objects.requireNonNull(builder.customModelName, "customModelName is required");
            this.hyperparameters = java.util.Objects.requireNonNull(builder.hyperparameters, "hyperparameters is required");
            this.jobName = java.util.Objects.requireNonNull(builder.jobName, "jobName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.customizationType = builder.customizationType;
            this.customModelKmsKeyId = builder.customModelKmsKeyId;
            this.outputDataConfig = builder.outputDataConfig;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.trainingDataConfig = builder.trainingDataConfig;
            this.validationDataConfig = builder.validationDataConfig;
            this.vpcConfig = builder.vpcConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBaseModelIdentifier() {
            return this.baseModelIdentifier;
        }

        @Override
        public final java.lang.String getCustomModelName() {
            return this.customModelName;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getHyperparameters() {
            return this.hyperparameters;
        }

        @Override
        public final java.lang.String getJobName() {
            return this.jobName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getCustomizationType() {
            return this.customizationType;
        }

        @Override
        public final java.lang.String getCustomModelKmsKeyId() {
            return this.customModelKmsKeyId;
        }

        @Override
        public final java.lang.Object getOutputDataConfig() {
            return this.outputDataConfig;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.bedrock_custom_model.BedrockCustomModelTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getTrainingDataConfig() {
            return this.trainingDataConfig;
        }

        @Override
        public final java.lang.Object getValidationDataConfig() {
            return this.validationDataConfig;
        }

        @Override
        public final java.lang.Object getVpcConfig() {
            return this.vpcConfig;
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

            data.set("baseModelIdentifier", om.valueToTree(this.getBaseModelIdentifier()));
            data.set("customModelName", om.valueToTree(this.getCustomModelName()));
            data.set("hyperparameters", om.valueToTree(this.getHyperparameters()));
            data.set("jobName", om.valueToTree(this.getJobName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getCustomizationType() != null) {
                data.set("customizationType", om.valueToTree(this.getCustomizationType()));
            }
            if (this.getCustomModelKmsKeyId() != null) {
                data.set("customModelKmsKeyId", om.valueToTree(this.getCustomModelKmsKeyId()));
            }
            if (this.getOutputDataConfig() != null) {
                data.set("outputDataConfig", om.valueToTree(this.getOutputDataConfig()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTrainingDataConfig() != null) {
                data.set("trainingDataConfig", om.valueToTree(this.getTrainingDataConfig()));
            }
            if (this.getValidationDataConfig() != null) {
                data.set("validationDataConfig", om.valueToTree(this.getValidationDataConfig()));
            }
            if (this.getVpcConfig() != null) {
                data.set("vpcConfig", om.valueToTree(this.getVpcConfig()));
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
            struct.set("fqn", om.valueToTree("aws.bedrockCustomModel.BedrockCustomModelConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockCustomModelConfig.Jsii$Proxy that = (BedrockCustomModelConfig.Jsii$Proxy) o;

            if (!baseModelIdentifier.equals(that.baseModelIdentifier)) return false;
            if (!customModelName.equals(that.customModelName)) return false;
            if (!hyperparameters.equals(that.hyperparameters)) return false;
            if (!jobName.equals(that.jobName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.customizationType != null ? !this.customizationType.equals(that.customizationType) : that.customizationType != null) return false;
            if (this.customModelKmsKeyId != null ? !this.customModelKmsKeyId.equals(that.customModelKmsKeyId) : that.customModelKmsKeyId != null) return false;
            if (this.outputDataConfig != null ? !this.outputDataConfig.equals(that.outputDataConfig) : that.outputDataConfig != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.trainingDataConfig != null ? !this.trainingDataConfig.equals(that.trainingDataConfig) : that.trainingDataConfig != null) return false;
            if (this.validationDataConfig != null ? !this.validationDataConfig.equals(that.validationDataConfig) : that.validationDataConfig != null) return false;
            if (this.vpcConfig != null ? !this.vpcConfig.equals(that.vpcConfig) : that.vpcConfig != null) return false;
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
            int result = this.baseModelIdentifier.hashCode();
            result = 31 * result + (this.customModelName.hashCode());
            result = 31 * result + (this.hyperparameters.hashCode());
            result = 31 * result + (this.jobName.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.customizationType != null ? this.customizationType.hashCode() : 0);
            result = 31 * result + (this.customModelKmsKeyId != null ? this.customModelKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.outputDataConfig != null ? this.outputDataConfig.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.trainingDataConfig != null ? this.trainingDataConfig.hashCode() : 0);
            result = 31 * result + (this.validationDataConfig != null ? this.validationDataConfig.hashCode() : 0);
            result = 31 * result + (this.vpcConfig != null ? this.vpcConfig.hashCode() : 0);
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
