package imports.aws.comprehend_entity_recognizer;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer aws_comprehend_entity_recognizer}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.360Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendEntityRecognizer.ComprehendEntityRecognizer")
public class ComprehendEntityRecognizer extends com.hashicorp.cdktf.TerraformResource {

    protected ComprehendEntityRecognizer(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ComprehendEntityRecognizer(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizer.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer aws_comprehend_entity_recognizer} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ComprehendEntityRecognizer(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ComprehendEntityRecognizer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ComprehendEntityRecognizer to import. This parameter is required.
     * @param importFromId The id of the existing ComprehendEntityRecognizer that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ComprehendEntityRecognizer to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ComprehendEntityRecognizer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ComprehendEntityRecognizer to import. This parameter is required.
     * @param importFromId The id of the existing ComprehendEntityRecognizer that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putInputDataConfig(final @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfig value) {
        software.amazon.jsii.Kernel.call(this, "putInputDataConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerVpcConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetModelKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetModelKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersionName() {
        software.amazon.jsii.Kernel.call(this, "resetVersionName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersionNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetVersionNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeKmsKeyId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigOutputReference getInputDataConfig() {
        return software.amazon.jsii.Kernel.get(this, "inputDataConfig", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerVpcConfigOutputReference getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerVpcConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dataAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfig getInputDataConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "inputDataConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "languageCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModelKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "modelKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "versionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "versionNamePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerVpcConfig getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerVpcConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "dataAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataAccessRoleArn", java.util.Objects.requireNonNull(value, "dataAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLanguageCode() {
        return software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLanguageCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "languageCode", java.util.Objects.requireNonNull(value, "languageCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getModelKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "modelKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setModelKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "modelKmsKeyId", java.util.Objects.requireNonNull(value, "modelKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionName() {
        return software.amazon.jsii.Kernel.get(this, "versionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "versionName", java.util.Objects.requireNonNull(value, "versionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "versionNamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersionNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "versionNamePrefix", java.util.Objects.requireNonNull(value, "versionNamePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "volumeKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeKmsKeyId", java.util.Objects.requireNonNull(value, "volumeKmsKeyId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizer}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizer> {
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
        private final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#data_access_role_arn ComprehendEntityRecognizer#data_access_role_arn}.
         * <p>
         * @return {@code this}
         * @param dataAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#data_access_role_arn ComprehendEntityRecognizer#data_access_role_arn}. This parameter is required.
         */
        public Builder dataAccessRoleArn(final java.lang.String dataAccessRoleArn) {
            this.config.dataAccessRoleArn(dataAccessRoleArn);
            return this;
        }

        /**
         * input_data_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#input_data_config ComprehendEntityRecognizer#input_data_config}
         * <p>
         * @return {@code this}
         * @param inputDataConfig input_data_config block. This parameter is required.
         */
        public Builder inputDataConfig(final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfig inputDataConfig) {
            this.config.inputDataConfig(inputDataConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#language_code ComprehendEntityRecognizer#language_code}.
         * <p>
         * @return {@code this}
         * @param languageCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#language_code ComprehendEntityRecognizer#language_code}. This parameter is required.
         */
        public Builder languageCode(final java.lang.String languageCode) {
            this.config.languageCode(languageCode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#name ComprehendEntityRecognizer#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#name ComprehendEntityRecognizer#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#id ComprehendEntityRecognizer#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#id ComprehendEntityRecognizer#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#model_kms_key_id ComprehendEntityRecognizer#model_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param modelKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#model_kms_key_id ComprehendEntityRecognizer#model_kms_key_id}. This parameter is required.
         */
        public Builder modelKmsKeyId(final java.lang.String modelKmsKeyId) {
            this.config.modelKmsKeyId(modelKmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#tags ComprehendEntityRecognizer#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#tags ComprehendEntityRecognizer#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#tags_all ComprehendEntityRecognizer#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#tags_all ComprehendEntityRecognizer#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#timeouts ComprehendEntityRecognizer#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#version_name ComprehendEntityRecognizer#version_name}.
         * <p>
         * @return {@code this}
         * @param versionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#version_name ComprehendEntityRecognizer#version_name}. This parameter is required.
         */
        public Builder versionName(final java.lang.String versionName) {
            this.config.versionName(versionName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#version_name_prefix ComprehendEntityRecognizer#version_name_prefix}.
         * <p>
         * @return {@code this}
         * @param versionNamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#version_name_prefix ComprehendEntityRecognizer#version_name_prefix}. This parameter is required.
         */
        public Builder versionNamePrefix(final java.lang.String versionNamePrefix) {
            this.config.versionNamePrefix(versionNamePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#volume_kms_key_id ComprehendEntityRecognizer#volume_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param volumeKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#volume_kms_key_id ComprehendEntityRecognizer#volume_kms_key_id}. This parameter is required.
         */
        public Builder volumeKmsKeyId(final java.lang.String volumeKmsKeyId) {
            this.config.volumeKmsKeyId(volumeKmsKeyId);
            return this;
        }

        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#vpc_config ComprehendEntityRecognizer#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerVpcConfig vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizer}.
         */
        @Override
        public imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizer build() {
            return new imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizer(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
