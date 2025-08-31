package imports.aws.comprehend_document_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendDocumentClassifier.ComprehendDocumentClassifierConfig")
@software.amazon.jsii.Jsii.Proxy(ComprehendDocumentClassifierConfig.Jsii$Proxy.class)
public interface ComprehendDocumentClassifierConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#data_access_role_arn ComprehendDocumentClassifier#data_access_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataAccessRoleArn();

    /**
     * input_data_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#input_data_config ComprehendDocumentClassifier#input_data_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig getInputDataConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#language_code ComprehendDocumentClassifier#language_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLanguageCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#name ComprehendDocumentClassifier#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#id ComprehendDocumentClassifier#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#mode ComprehendDocumentClassifier#mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#model_kms_key_id ComprehendDocumentClassifier#model_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getModelKmsKeyId() {
        return null;
    }

    /**
     * output_data_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#output_data_config ComprehendDocumentClassifier#output_data_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierOutputDataConfig getOutputDataConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#tags ComprehendDocumentClassifier#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#tags_all ComprehendDocumentClassifier#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#timeouts ComprehendDocumentClassifier#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#version_name ComprehendDocumentClassifier#version_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#version_name_prefix ComprehendDocumentClassifier#version_name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersionNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#volume_kms_key_id ComprehendDocumentClassifier#volume_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeKmsKeyId() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#vpc_config ComprehendDocumentClassifier#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierVpcConfig getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComprehendDocumentClassifierConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComprehendDocumentClassifierConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComprehendDocumentClassifierConfig> {
        java.lang.String dataAccessRoleArn;
        imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig inputDataConfig;
        java.lang.String languageCode;
        java.lang.String name;
        java.lang.String id;
        java.lang.String mode;
        java.lang.String modelKmsKeyId;
        imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierOutputDataConfig outputDataConfig;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierTimeouts timeouts;
        java.lang.String versionName;
        java.lang.String versionNamePrefix;
        java.lang.String volumeKmsKeyId;
        imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierVpcConfig vpcConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getDataAccessRoleArn}
         * @param dataAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#data_access_role_arn ComprehendDocumentClassifier#data_access_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataAccessRoleArn(java.lang.String dataAccessRoleArn) {
            this.dataAccessRoleArn = dataAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getInputDataConfig}
         * @param inputDataConfig input_data_config block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#input_data_config ComprehendDocumentClassifier#input_data_config}
         * @return {@code this}
         */
        public Builder inputDataConfig(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig inputDataConfig) {
            this.inputDataConfig = inputDataConfig;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getLanguageCode}
         * @param languageCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#language_code ComprehendDocumentClassifier#language_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder languageCode(java.lang.String languageCode) {
            this.languageCode = languageCode;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#name ComprehendDocumentClassifier#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#id ComprehendDocumentClassifier#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#mode ComprehendDocumentClassifier#mode}.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getModelKmsKeyId}
         * @param modelKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#model_kms_key_id ComprehendDocumentClassifier#model_kms_key_id}.
         * @return {@code this}
         */
        public Builder modelKmsKeyId(java.lang.String modelKmsKeyId) {
            this.modelKmsKeyId = modelKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getOutputDataConfig}
         * @param outputDataConfig output_data_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#output_data_config ComprehendDocumentClassifier#output_data_config}
         * @return {@code this}
         */
        public Builder outputDataConfig(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierOutputDataConfig outputDataConfig) {
            this.outputDataConfig = outputDataConfig;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#tags ComprehendDocumentClassifier#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#tags_all ComprehendDocumentClassifier#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#timeouts ComprehendDocumentClassifier#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getVersionName}
         * @param versionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#version_name ComprehendDocumentClassifier#version_name}.
         * @return {@code this}
         */
        public Builder versionName(java.lang.String versionName) {
            this.versionName = versionName;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getVersionNamePrefix}
         * @param versionNamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#version_name_prefix ComprehendDocumentClassifier#version_name_prefix}.
         * @return {@code this}
         */
        public Builder versionNamePrefix(java.lang.String versionNamePrefix) {
            this.versionNamePrefix = versionNamePrefix;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getVolumeKmsKeyId}
         * @param volumeKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#volume_kms_key_id ComprehendDocumentClassifier#volume_kms_key_id}.
         * @return {@code this}
         */
        public Builder volumeKmsKeyId(java.lang.String volumeKmsKeyId) {
            this.volumeKmsKeyId = volumeKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#vpc_config ComprehendDocumentClassifier#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getDependsOn}
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
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierConfig#getProvisioners}
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
         * @return a new instance of {@link ComprehendDocumentClassifierConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComprehendDocumentClassifierConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComprehendDocumentClassifierConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComprehendDocumentClassifierConfig {
        private final java.lang.String dataAccessRoleArn;
        private final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig inputDataConfig;
        private final java.lang.String languageCode;
        private final java.lang.String name;
        private final java.lang.String id;
        private final java.lang.String mode;
        private final java.lang.String modelKmsKeyId;
        private final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierOutputDataConfig outputDataConfig;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierTimeouts timeouts;
        private final java.lang.String versionName;
        private final java.lang.String versionNamePrefix;
        private final java.lang.String volumeKmsKeyId;
        private final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierVpcConfig vpcConfig;
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
            this.dataAccessRoleArn = software.amazon.jsii.Kernel.get(this, "dataAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputDataConfig = software.amazon.jsii.Kernel.get(this, "inputDataConfig", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig.class));
            this.languageCode = software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.modelKmsKeyId = software.amazon.jsii.Kernel.get(this, "modelKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputDataConfig = software.amazon.jsii.Kernel.get(this, "outputDataConfig", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierOutputDataConfig.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierTimeouts.class));
            this.versionName = software.amazon.jsii.Kernel.get(this, "versionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.versionNamePrefix = software.amazon.jsii.Kernel.get(this, "versionNamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.volumeKmsKeyId = software.amazon.jsii.Kernel.get(this, "volumeKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierVpcConfig.class));
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
            this.dataAccessRoleArn = java.util.Objects.requireNonNull(builder.dataAccessRoleArn, "dataAccessRoleArn is required");
            this.inputDataConfig = java.util.Objects.requireNonNull(builder.inputDataConfig, "inputDataConfig is required");
            this.languageCode = java.util.Objects.requireNonNull(builder.languageCode, "languageCode is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.id = builder.id;
            this.mode = builder.mode;
            this.modelKmsKeyId = builder.modelKmsKeyId;
            this.outputDataConfig = builder.outputDataConfig;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.versionName = builder.versionName;
            this.versionNamePrefix = builder.versionNamePrefix;
            this.volumeKmsKeyId = builder.volumeKmsKeyId;
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
        public final java.lang.String getDataAccessRoleArn() {
            return this.dataAccessRoleArn;
        }

        @Override
        public final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig getInputDataConfig() {
            return this.inputDataConfig;
        }

        @Override
        public final java.lang.String getLanguageCode() {
            return this.languageCode;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getMode() {
            return this.mode;
        }

        @Override
        public final java.lang.String getModelKmsKeyId() {
            return this.modelKmsKeyId;
        }

        @Override
        public final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierOutputDataConfig getOutputDataConfig() {
            return this.outputDataConfig;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getVersionName() {
            return this.versionName;
        }

        @Override
        public final java.lang.String getVersionNamePrefix() {
            return this.versionNamePrefix;
        }

        @Override
        public final java.lang.String getVolumeKmsKeyId() {
            return this.volumeKmsKeyId;
        }

        @Override
        public final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierVpcConfig getVpcConfig() {
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

            data.set("dataAccessRoleArn", om.valueToTree(this.getDataAccessRoleArn()));
            data.set("inputDataConfig", om.valueToTree(this.getInputDataConfig()));
            data.set("languageCode", om.valueToTree(this.getLanguageCode()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMode() != null) {
                data.set("mode", om.valueToTree(this.getMode()));
            }
            if (this.getModelKmsKeyId() != null) {
                data.set("modelKmsKeyId", om.valueToTree(this.getModelKmsKeyId()));
            }
            if (this.getOutputDataConfig() != null) {
                data.set("outputDataConfig", om.valueToTree(this.getOutputDataConfig()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVersionName() != null) {
                data.set("versionName", om.valueToTree(this.getVersionName()));
            }
            if (this.getVersionNamePrefix() != null) {
                data.set("versionNamePrefix", om.valueToTree(this.getVersionNamePrefix()));
            }
            if (this.getVolumeKmsKeyId() != null) {
                data.set("volumeKmsKeyId", om.valueToTree(this.getVolumeKmsKeyId()));
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
            struct.set("fqn", om.valueToTree("aws.comprehendDocumentClassifier.ComprehendDocumentClassifierConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComprehendDocumentClassifierConfig.Jsii$Proxy that = (ComprehendDocumentClassifierConfig.Jsii$Proxy) o;

            if (!dataAccessRoleArn.equals(that.dataAccessRoleArn)) return false;
            if (!inputDataConfig.equals(that.inputDataConfig)) return false;
            if (!languageCode.equals(that.languageCode)) return false;
            if (!name.equals(that.name)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.mode != null ? !this.mode.equals(that.mode) : that.mode != null) return false;
            if (this.modelKmsKeyId != null ? !this.modelKmsKeyId.equals(that.modelKmsKeyId) : that.modelKmsKeyId != null) return false;
            if (this.outputDataConfig != null ? !this.outputDataConfig.equals(that.outputDataConfig) : that.outputDataConfig != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.versionName != null ? !this.versionName.equals(that.versionName) : that.versionName != null) return false;
            if (this.versionNamePrefix != null ? !this.versionNamePrefix.equals(that.versionNamePrefix) : that.versionNamePrefix != null) return false;
            if (this.volumeKmsKeyId != null ? !this.volumeKmsKeyId.equals(that.volumeKmsKeyId) : that.volumeKmsKeyId != null) return false;
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
            int result = this.dataAccessRoleArn.hashCode();
            result = 31 * result + (this.inputDataConfig.hashCode());
            result = 31 * result + (this.languageCode.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.mode != null ? this.mode.hashCode() : 0);
            result = 31 * result + (this.modelKmsKeyId != null ? this.modelKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.outputDataConfig != null ? this.outputDataConfig.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.versionName != null ? this.versionName.hashCode() : 0);
            result = 31 * result + (this.versionNamePrefix != null ? this.versionNamePrefix.hashCode() : 0);
            result = 31 * result + (this.volumeKmsKeyId != null ? this.volumeKmsKeyId.hashCode() : 0);
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
