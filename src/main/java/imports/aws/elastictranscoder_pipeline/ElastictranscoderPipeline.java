package imports.aws.elastictranscoder_pipeline;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline aws_elastictranscoder_pipeline}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.187Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPipeline.ElastictranscoderPipeline")
public class ElastictranscoderPipeline extends com.hashicorp.cdktf.TerraformResource {

    protected ElastictranscoderPipeline(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElastictranscoderPipeline(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipeline.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline aws_elastictranscoder_pipeline} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ElastictranscoderPipeline(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ElastictranscoderPipeline resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElastictranscoderPipeline to import. This parameter is required.
     * @param importFromId The id of the existing ElastictranscoderPipeline that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ElastictranscoderPipeline to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipeline.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ElastictranscoderPipeline resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElastictranscoderPipeline to import. This parameter is required.
     * @param importFromId The id of the existing ElastictranscoderPipeline that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipeline.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putContentConfig(final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig value) {
        software.amazon.jsii.Kernel.call(this, "putContentConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putContentConfigPermissions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigPermissions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigPermissions> __cast_cd4240 = (java.util.List<imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigPermissions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigPermissions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putContentConfigPermissions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNotifications(final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications value) {
        software.amazon.jsii.Kernel.call(this, "putNotifications", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThumbnailConfig(final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig value) {
        software.amazon.jsii.Kernel.call(this, "putThumbnailConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThumbnailConfigPermissions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigPermissions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigPermissions> __cast_cd4240 = (java.util.List<imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigPermissions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigPermissions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putThumbnailConfigPermissions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetAwsKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentConfig() {
        software.amazon.jsii.Kernel.call(this, "resetContentConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentConfigPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetContentConfigPermissions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotifications() {
        software.amazon.jsii.Kernel.call(this, "resetNotifications", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputBucket() {
        software.amazon.jsii.Kernel.call(this, "resetOutputBucket", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThumbnailConfig() {
        software.amazon.jsii.Kernel.call(this, "resetThumbnailConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThumbnailConfigPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetThumbnailConfigPermissions", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigOutputReference getContentConfig() {
        return software.amazon.jsii.Kernel.get(this, "contentConfig", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigPermissionsList getContentConfigPermissions() {
        return software.amazon.jsii.Kernel.get(this, "contentConfigPermissions", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigPermissionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotificationsOutputReference getNotifications() {
        return software.amazon.jsii.Kernel.get(this, "notifications", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotificationsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigOutputReference getThumbnailConfig() {
        return software.amazon.jsii.Kernel.get(this, "thumbnailConfig", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigPermissionsList getThumbnailConfigPermissions() {
        return software.amazon.jsii.Kernel.get(this, "thumbnailConfigPermissions", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigPermissionsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "awsKmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig getContentConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "contentConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContentConfigPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "contentConfigPermissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "inputBucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications getNotificationsInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationsInput", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "outputBucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "roleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig getThumbnailConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "thumbnailConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getThumbnailConfigPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "thumbnailConfigPermissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "awsKmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsKmsKeyArn", java.util.Objects.requireNonNull(value, "awsKmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputBucket() {
        return software.amazon.jsii.Kernel.get(this, "inputBucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputBucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputBucket", java.util.Objects.requireNonNull(value, "inputBucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputBucket() {
        return software.amazon.jsii.Kernel.get(this, "outputBucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputBucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputBucket", java.util.Objects.requireNonNull(value, "outputBucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRole() {
        return software.amazon.jsii.Kernel.get(this, "role", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "role", java.util.Objects.requireNonNull(value, "role is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.elastictranscoder_pipeline.ElastictranscoderPipeline}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.elastictranscoder_pipeline.ElastictranscoderPipeline> {
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
        private final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#input_bucket ElastictranscoderPipeline#input_bucket}.
         * <p>
         * @return {@code this}
         * @param inputBucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#input_bucket ElastictranscoderPipeline#input_bucket}. This parameter is required.
         */
        public Builder inputBucket(final java.lang.String inputBucket) {
            this.config.inputBucket(inputBucket);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#role ElastictranscoderPipeline#role}.
         * <p>
         * @return {@code this}
         * @param role Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#role ElastictranscoderPipeline#role}. This parameter is required.
         */
        public Builder role(final java.lang.String role) {
            this.config.role(role);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#aws_kms_key_arn ElastictranscoderPipeline#aws_kms_key_arn}.
         * <p>
         * @return {@code this}
         * @param awsKmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#aws_kms_key_arn ElastictranscoderPipeline#aws_kms_key_arn}. This parameter is required.
         */
        public Builder awsKmsKeyArn(final java.lang.String awsKmsKeyArn) {
            this.config.awsKmsKeyArn(awsKmsKeyArn);
            return this;
        }

        /**
         * content_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#content_config ElastictranscoderPipeline#content_config}
         * <p>
         * @return {@code this}
         * @param contentConfig content_config block. This parameter is required.
         */
        public Builder contentConfig(final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig contentConfig) {
            this.config.contentConfig(contentConfig);
            return this;
        }

        /**
         * content_config_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#content_config_permissions ElastictranscoderPipeline#content_config_permissions}
         * <p>
         * @return {@code this}
         * @param contentConfigPermissions content_config_permissions block. This parameter is required.
         */
        public Builder contentConfigPermissions(final com.hashicorp.cdktf.IResolvable contentConfigPermissions) {
            this.config.contentConfigPermissions(contentConfigPermissions);
            return this;
        }
        /**
         * content_config_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#content_config_permissions ElastictranscoderPipeline#content_config_permissions}
         * <p>
         * @return {@code this}
         * @param contentConfigPermissions content_config_permissions block. This parameter is required.
         */
        public Builder contentConfigPermissions(final java.util.List<? extends imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigPermissions> contentConfigPermissions) {
            this.config.contentConfigPermissions(contentConfigPermissions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#id ElastictranscoderPipeline#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#id ElastictranscoderPipeline#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#name ElastictranscoderPipeline#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#name ElastictranscoderPipeline#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * notifications block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#notifications ElastictranscoderPipeline#notifications}
         * <p>
         * @return {@code this}
         * @param notifications notifications block. This parameter is required.
         */
        public Builder notifications(final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications notifications) {
            this.config.notifications(notifications);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#output_bucket ElastictranscoderPipeline#output_bucket}.
         * <p>
         * @return {@code this}
         * @param outputBucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#output_bucket ElastictranscoderPipeline#output_bucket}. This parameter is required.
         */
        public Builder outputBucket(final java.lang.String outputBucket) {
            this.config.outputBucket(outputBucket);
            return this;
        }

        /**
         * thumbnail_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#thumbnail_config ElastictranscoderPipeline#thumbnail_config}
         * <p>
         * @return {@code this}
         * @param thumbnailConfig thumbnail_config block. This parameter is required.
         */
        public Builder thumbnailConfig(final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig thumbnailConfig) {
            this.config.thumbnailConfig(thumbnailConfig);
            return this;
        }

        /**
         * thumbnail_config_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#thumbnail_config_permissions ElastictranscoderPipeline#thumbnail_config_permissions}
         * <p>
         * @return {@code this}
         * @param thumbnailConfigPermissions thumbnail_config_permissions block. This parameter is required.
         */
        public Builder thumbnailConfigPermissions(final com.hashicorp.cdktf.IResolvable thumbnailConfigPermissions) {
            this.config.thumbnailConfigPermissions(thumbnailConfigPermissions);
            return this;
        }
        /**
         * thumbnail_config_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#thumbnail_config_permissions ElastictranscoderPipeline#thumbnail_config_permissions}
         * <p>
         * @return {@code this}
         * @param thumbnailConfigPermissions thumbnail_config_permissions block. This parameter is required.
         */
        public Builder thumbnailConfigPermissions(final java.util.List<? extends imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigPermissions> thumbnailConfigPermissions) {
            this.config.thumbnailConfigPermissions(thumbnailConfigPermissions);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.elastictranscoder_pipeline.ElastictranscoderPipeline}.
         */
        @Override
        public imports.aws.elastictranscoder_pipeline.ElastictranscoderPipeline build() {
            return new imports.aws.elastictranscoder_pipeline.ElastictranscoderPipeline(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
