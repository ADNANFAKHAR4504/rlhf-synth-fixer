package imports.aws.cloudfront_field_level_encryption_config;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config aws_cloudfront_field_level_encryption_config}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.238Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfig")
public class CloudfrontFieldLevelEncryptionConfig extends com.hashicorp.cdktf.TerraformResource {

    protected CloudfrontFieldLevelEncryptionConfig(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontFieldLevelEncryptionConfig(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfig.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config aws_cloudfront_field_level_encryption_config} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudfrontFieldLevelEncryptionConfig(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudfrontFieldLevelEncryptionConfig resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudfrontFieldLevelEncryptionConfig to import. This parameter is required.
     * @param importFromId The id of the existing CloudfrontFieldLevelEncryptionConfig that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudfrontFieldLevelEncryptionConfig to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfig.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudfrontFieldLevelEncryptionConfig resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudfrontFieldLevelEncryptionConfig to import. This parameter is required.
     * @param importFromId The id of the existing CloudfrontFieldLevelEncryptionConfig that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfig.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putContentTypeProfileConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig value) {
        software.amazon.jsii.Kernel.call(this, "putContentTypeProfileConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQueryArgProfileConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig value) {
        software.amazon.jsii.Kernel.call(this, "putQueryArgProfileConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetComment() {
        software.amazon.jsii.Kernel.call(this, "resetComment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCallerReference() {
        return software.amazon.jsii.Kernel.get(this, "callerReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigOutputReference getContentTypeProfileConfig() {
        return software.amazon.jsii.Kernel.get(this, "contentTypeProfileConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEtag() {
        return software.amazon.jsii.Kernel.get(this, "etag", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigOutputReference getQueryArgProfileConfig() {
        return software.amazon.jsii.Kernel.get(this, "queryArgProfileConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCommentInput() {
        return software.amazon.jsii.Kernel.get(this, "commentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig getContentTypeProfileConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "contentTypeProfileConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig getQueryArgProfileConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "queryArgProfileConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComment() {
        return software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "comment", java.util.Objects.requireNonNull(value, "comment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfig}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfig> {
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
        private final imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigConfig.Builder();
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
         * content_type_profile_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#content_type_profile_config CloudfrontFieldLevelEncryptionConfig#content_type_profile_config}
         * <p>
         * @return {@code this}
         * @param contentTypeProfileConfig content_type_profile_config block. This parameter is required.
         */
        public Builder contentTypeProfileConfig(final imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig contentTypeProfileConfig) {
            this.config.contentTypeProfileConfig(contentTypeProfileConfig);
            return this;
        }

        /**
         * query_arg_profile_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#query_arg_profile_config CloudfrontFieldLevelEncryptionConfig#query_arg_profile_config}
         * <p>
         * @return {@code this}
         * @param queryArgProfileConfig query_arg_profile_config block. This parameter is required.
         */
        public Builder queryArgProfileConfig(final imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig queryArgProfileConfig) {
            this.config.queryArgProfileConfig(queryArgProfileConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#comment CloudfrontFieldLevelEncryptionConfig#comment}.
         * <p>
         * @return {@code this}
         * @param comment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#comment CloudfrontFieldLevelEncryptionConfig#comment}. This parameter is required.
         */
        public Builder comment(final java.lang.String comment) {
            this.config.comment(comment);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#id CloudfrontFieldLevelEncryptionConfig#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#id CloudfrontFieldLevelEncryptionConfig#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfig}.
         */
        @Override
        public imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfig build() {
            return new imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfig(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
