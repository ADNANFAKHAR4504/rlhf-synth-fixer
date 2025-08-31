package imports.aws.elastictranscoder_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.187Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPipeline.ElastictranscoderPipelineConfig")
@software.amazon.jsii.Jsii.Proxy(ElastictranscoderPipelineConfig.Jsii$Proxy.class)
public interface ElastictranscoderPipelineConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#input_bucket ElastictranscoderPipeline#input_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInputBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#role ElastictranscoderPipeline#role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#aws_kms_key_arn ElastictranscoderPipeline#aws_kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsKmsKeyArn() {
        return null;
    }

    /**
     * content_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#content_config ElastictranscoderPipeline#content_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig getContentConfig() {
        return null;
    }

    /**
     * content_config_permissions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#content_config_permissions ElastictranscoderPipeline#content_config_permissions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContentConfigPermissions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#id ElastictranscoderPipeline#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#name ElastictranscoderPipeline#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * notifications block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#notifications ElastictranscoderPipeline#notifications}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications getNotifications() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#output_bucket ElastictranscoderPipeline#output_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputBucket() {
        return null;
    }

    /**
     * thumbnail_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#thumbnail_config ElastictranscoderPipeline#thumbnail_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig getThumbnailConfig() {
        return null;
    }

    /**
     * thumbnail_config_permissions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#thumbnail_config_permissions ElastictranscoderPipeline#thumbnail_config_permissions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getThumbnailConfigPermissions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElastictranscoderPipelineConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElastictranscoderPipelineConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElastictranscoderPipelineConfig> {
        java.lang.String inputBucket;
        java.lang.String role;
        java.lang.String awsKmsKeyArn;
        imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig contentConfig;
        java.lang.Object contentConfigPermissions;
        java.lang.String id;
        java.lang.String name;
        imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications notifications;
        java.lang.String outputBucket;
        imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig thumbnailConfig;
        java.lang.Object thumbnailConfigPermissions;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getInputBucket}
         * @param inputBucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#input_bucket ElastictranscoderPipeline#input_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder inputBucket(java.lang.String inputBucket) {
            this.inputBucket = inputBucket;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getRole}
         * @param role Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#role ElastictranscoderPipeline#role}. This parameter is required.
         * @return {@code this}
         */
        public Builder role(java.lang.String role) {
            this.role = role;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getAwsKmsKeyArn}
         * @param awsKmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#aws_kms_key_arn ElastictranscoderPipeline#aws_kms_key_arn}.
         * @return {@code this}
         */
        public Builder awsKmsKeyArn(java.lang.String awsKmsKeyArn) {
            this.awsKmsKeyArn = awsKmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getContentConfig}
         * @param contentConfig content_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#content_config ElastictranscoderPipeline#content_config}
         * @return {@code this}
         */
        public Builder contentConfig(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig contentConfig) {
            this.contentConfig = contentConfig;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getContentConfigPermissions}
         * @param contentConfigPermissions content_config_permissions block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#content_config_permissions ElastictranscoderPipeline#content_config_permissions}
         * @return {@code this}
         */
        public Builder contentConfigPermissions(com.hashicorp.cdktf.IResolvable contentConfigPermissions) {
            this.contentConfigPermissions = contentConfigPermissions;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getContentConfigPermissions}
         * @param contentConfigPermissions content_config_permissions block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#content_config_permissions ElastictranscoderPipeline#content_config_permissions}
         * @return {@code this}
         */
        public Builder contentConfigPermissions(java.util.List<? extends imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfigPermissions> contentConfigPermissions) {
            this.contentConfigPermissions = contentConfigPermissions;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#id ElastictranscoderPipeline#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#name ElastictranscoderPipeline#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getNotifications}
         * @param notifications notifications block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#notifications ElastictranscoderPipeline#notifications}
         * @return {@code this}
         */
        public Builder notifications(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications notifications) {
            this.notifications = notifications;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getOutputBucket}
         * @param outputBucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#output_bucket ElastictranscoderPipeline#output_bucket}.
         * @return {@code this}
         */
        public Builder outputBucket(java.lang.String outputBucket) {
            this.outputBucket = outputBucket;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getThumbnailConfig}
         * @param thumbnailConfig thumbnail_config block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#thumbnail_config ElastictranscoderPipeline#thumbnail_config}
         * @return {@code this}
         */
        public Builder thumbnailConfig(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig thumbnailConfig) {
            this.thumbnailConfig = thumbnailConfig;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getThumbnailConfigPermissions}
         * @param thumbnailConfigPermissions thumbnail_config_permissions block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#thumbnail_config_permissions ElastictranscoderPipeline#thumbnail_config_permissions}
         * @return {@code this}
         */
        public Builder thumbnailConfigPermissions(com.hashicorp.cdktf.IResolvable thumbnailConfigPermissions) {
            this.thumbnailConfigPermissions = thumbnailConfigPermissions;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getThumbnailConfigPermissions}
         * @param thumbnailConfigPermissions thumbnail_config_permissions block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#thumbnail_config_permissions ElastictranscoderPipeline#thumbnail_config_permissions}
         * @return {@code this}
         */
        public Builder thumbnailConfigPermissions(java.util.List<? extends imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfigPermissions> thumbnailConfigPermissions) {
            this.thumbnailConfigPermissions = thumbnailConfigPermissions;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getDependsOn}
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
         * Sets the value of {@link ElastictranscoderPipelineConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineConfig#getProvisioners}
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
         * @return a new instance of {@link ElastictranscoderPipelineConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElastictranscoderPipelineConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElastictranscoderPipelineConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElastictranscoderPipelineConfig {
        private final java.lang.String inputBucket;
        private final java.lang.String role;
        private final java.lang.String awsKmsKeyArn;
        private final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig contentConfig;
        private final java.lang.Object contentConfigPermissions;
        private final java.lang.String id;
        private final java.lang.String name;
        private final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications notifications;
        private final java.lang.String outputBucket;
        private final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig thumbnailConfig;
        private final java.lang.Object thumbnailConfigPermissions;
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
            this.inputBucket = software.amazon.jsii.Kernel.get(this, "inputBucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.role = software.amazon.jsii.Kernel.get(this, "role", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsKmsKeyArn = software.amazon.jsii.Kernel.get(this, "awsKmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentConfig = software.amazon.jsii.Kernel.get(this, "contentConfig", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig.class));
            this.contentConfigPermissions = software.amazon.jsii.Kernel.get(this, "contentConfigPermissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notifications = software.amazon.jsii.Kernel.get(this, "notifications", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications.class));
            this.outputBucket = software.amazon.jsii.Kernel.get(this, "outputBucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.thumbnailConfig = software.amazon.jsii.Kernel.get(this, "thumbnailConfig", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig.class));
            this.thumbnailConfigPermissions = software.amazon.jsii.Kernel.get(this, "thumbnailConfigPermissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.inputBucket = java.util.Objects.requireNonNull(builder.inputBucket, "inputBucket is required");
            this.role = java.util.Objects.requireNonNull(builder.role, "role is required");
            this.awsKmsKeyArn = builder.awsKmsKeyArn;
            this.contentConfig = builder.contentConfig;
            this.contentConfigPermissions = builder.contentConfigPermissions;
            this.id = builder.id;
            this.name = builder.name;
            this.notifications = builder.notifications;
            this.outputBucket = builder.outputBucket;
            this.thumbnailConfig = builder.thumbnailConfig;
            this.thumbnailConfigPermissions = builder.thumbnailConfigPermissions;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getInputBucket() {
            return this.inputBucket;
        }

        @Override
        public final java.lang.String getRole() {
            return this.role;
        }

        @Override
        public final java.lang.String getAwsKmsKeyArn() {
            return this.awsKmsKeyArn;
        }

        @Override
        public final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineContentConfig getContentConfig() {
            return this.contentConfig;
        }

        @Override
        public final java.lang.Object getContentConfigPermissions() {
            return this.contentConfigPermissions;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineNotifications getNotifications() {
            return this.notifications;
        }

        @Override
        public final java.lang.String getOutputBucket() {
            return this.outputBucket;
        }

        @Override
        public final imports.aws.elastictranscoder_pipeline.ElastictranscoderPipelineThumbnailConfig getThumbnailConfig() {
            return this.thumbnailConfig;
        }

        @Override
        public final java.lang.Object getThumbnailConfigPermissions() {
            return this.thumbnailConfigPermissions;
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

            data.set("inputBucket", om.valueToTree(this.getInputBucket()));
            data.set("role", om.valueToTree(this.getRole()));
            if (this.getAwsKmsKeyArn() != null) {
                data.set("awsKmsKeyArn", om.valueToTree(this.getAwsKmsKeyArn()));
            }
            if (this.getContentConfig() != null) {
                data.set("contentConfig", om.valueToTree(this.getContentConfig()));
            }
            if (this.getContentConfigPermissions() != null) {
                data.set("contentConfigPermissions", om.valueToTree(this.getContentConfigPermissions()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNotifications() != null) {
                data.set("notifications", om.valueToTree(this.getNotifications()));
            }
            if (this.getOutputBucket() != null) {
                data.set("outputBucket", om.valueToTree(this.getOutputBucket()));
            }
            if (this.getThumbnailConfig() != null) {
                data.set("thumbnailConfig", om.valueToTree(this.getThumbnailConfig()));
            }
            if (this.getThumbnailConfigPermissions() != null) {
                data.set("thumbnailConfigPermissions", om.valueToTree(this.getThumbnailConfigPermissions()));
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
            struct.set("fqn", om.valueToTree("aws.elastictranscoderPipeline.ElastictranscoderPipelineConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElastictranscoderPipelineConfig.Jsii$Proxy that = (ElastictranscoderPipelineConfig.Jsii$Proxy) o;

            if (!inputBucket.equals(that.inputBucket)) return false;
            if (!role.equals(that.role)) return false;
            if (this.awsKmsKeyArn != null ? !this.awsKmsKeyArn.equals(that.awsKmsKeyArn) : that.awsKmsKeyArn != null) return false;
            if (this.contentConfig != null ? !this.contentConfig.equals(that.contentConfig) : that.contentConfig != null) return false;
            if (this.contentConfigPermissions != null ? !this.contentConfigPermissions.equals(that.contentConfigPermissions) : that.contentConfigPermissions != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.notifications != null ? !this.notifications.equals(that.notifications) : that.notifications != null) return false;
            if (this.outputBucket != null ? !this.outputBucket.equals(that.outputBucket) : that.outputBucket != null) return false;
            if (this.thumbnailConfig != null ? !this.thumbnailConfig.equals(that.thumbnailConfig) : that.thumbnailConfig != null) return false;
            if (this.thumbnailConfigPermissions != null ? !this.thumbnailConfigPermissions.equals(that.thumbnailConfigPermissions) : that.thumbnailConfigPermissions != null) return false;
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
            int result = this.inputBucket.hashCode();
            result = 31 * result + (this.role.hashCode());
            result = 31 * result + (this.awsKmsKeyArn != null ? this.awsKmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.contentConfig != null ? this.contentConfig.hashCode() : 0);
            result = 31 * result + (this.contentConfigPermissions != null ? this.contentConfigPermissions.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.notifications != null ? this.notifications.hashCode() : 0);
            result = 31 * result + (this.outputBucket != null ? this.outputBucket.hashCode() : 0);
            result = 31 * result + (this.thumbnailConfig != null ? this.thumbnailConfig.hashCode() : 0);
            result = 31 * result + (this.thumbnailConfigPermissions != null ? this.thumbnailConfigPermissions.hashCode() : 0);
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
