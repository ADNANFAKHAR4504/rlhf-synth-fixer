package imports.aws.imagebuilder_image_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImagePipeline.ImagebuilderImagePipelineConfig")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImagePipelineConfig.Jsii$Proxy.class)
public interface ImagebuilderImagePipelineConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#infrastructure_configuration_arn ImagebuilderImagePipeline#infrastructure_configuration_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInfrastructureConfigurationArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#name ImagebuilderImagePipeline#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#container_recipe_arn ImagebuilderImagePipeline#container_recipe_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContainerRecipeArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#description ImagebuilderImagePipeline#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#distribution_configuration_arn ImagebuilderImagePipeline#distribution_configuration_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDistributionConfigurationArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#enhanced_image_metadata_enabled ImagebuilderImagePipeline#enhanced_image_metadata_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnhancedImageMetadataEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#execution_role ImagebuilderImagePipeline#execution_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#id ImagebuilderImagePipeline#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#image_recipe_arn ImagebuilderImagePipeline#image_recipe_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageRecipeArn() {
        return null;
    }

    /**
     * image_scanning_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#image_scanning_configuration ImagebuilderImagePipeline#image_scanning_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration getImageScanningConfiguration() {
        return null;
    }

    /**
     * image_tests_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#image_tests_configuration ImagebuilderImagePipeline#image_tests_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration getImageTestsConfiguration() {
        return null;
    }

    /**
     * schedule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#schedule ImagebuilderImagePipeline#schedule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineSchedule getSchedule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#status ImagebuilderImagePipeline#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#tags ImagebuilderImagePipeline#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#tags_all ImagebuilderImagePipeline#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * workflow block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#workflow ImagebuilderImagePipeline#workflow}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWorkflow() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImagePipelineConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImagePipelineConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImagePipelineConfig> {
        java.lang.String infrastructureConfigurationArn;
        java.lang.String name;
        java.lang.String containerRecipeArn;
        java.lang.String description;
        java.lang.String distributionConfigurationArn;
        java.lang.Object enhancedImageMetadataEnabled;
        java.lang.String executionRole;
        java.lang.String id;
        java.lang.String imageRecipeArn;
        imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration imageScanningConfiguration;
        imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration imageTestsConfiguration;
        imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineSchedule schedule;
        java.lang.String status;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object workflow;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getInfrastructureConfigurationArn}
         * @param infrastructureConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#infrastructure_configuration_arn ImagebuilderImagePipeline#infrastructure_configuration_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder infrastructureConfigurationArn(java.lang.String infrastructureConfigurationArn) {
            this.infrastructureConfigurationArn = infrastructureConfigurationArn;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#name ImagebuilderImagePipeline#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getContainerRecipeArn}
         * @param containerRecipeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#container_recipe_arn ImagebuilderImagePipeline#container_recipe_arn}.
         * @return {@code this}
         */
        public Builder containerRecipeArn(java.lang.String containerRecipeArn) {
            this.containerRecipeArn = containerRecipeArn;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#description ImagebuilderImagePipeline#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getDistributionConfigurationArn}
         * @param distributionConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#distribution_configuration_arn ImagebuilderImagePipeline#distribution_configuration_arn}.
         * @return {@code this}
         */
        public Builder distributionConfigurationArn(java.lang.String distributionConfigurationArn) {
            this.distributionConfigurationArn = distributionConfigurationArn;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getEnhancedImageMetadataEnabled}
         * @param enhancedImageMetadataEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#enhanced_image_metadata_enabled ImagebuilderImagePipeline#enhanced_image_metadata_enabled}.
         * @return {@code this}
         */
        public Builder enhancedImageMetadataEnabled(java.lang.Boolean enhancedImageMetadataEnabled) {
            this.enhancedImageMetadataEnabled = enhancedImageMetadataEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getEnhancedImageMetadataEnabled}
         * @param enhancedImageMetadataEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#enhanced_image_metadata_enabled ImagebuilderImagePipeline#enhanced_image_metadata_enabled}.
         * @return {@code this}
         */
        public Builder enhancedImageMetadataEnabled(com.hashicorp.cdktf.IResolvable enhancedImageMetadataEnabled) {
            this.enhancedImageMetadataEnabled = enhancedImageMetadataEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getExecutionRole}
         * @param executionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#execution_role ImagebuilderImagePipeline#execution_role}.
         * @return {@code this}
         */
        public Builder executionRole(java.lang.String executionRole) {
            this.executionRole = executionRole;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#id ImagebuilderImagePipeline#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getImageRecipeArn}
         * @param imageRecipeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#image_recipe_arn ImagebuilderImagePipeline#image_recipe_arn}.
         * @return {@code this}
         */
        public Builder imageRecipeArn(java.lang.String imageRecipeArn) {
            this.imageRecipeArn = imageRecipeArn;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getImageScanningConfiguration}
         * @param imageScanningConfiguration image_scanning_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#image_scanning_configuration ImagebuilderImagePipeline#image_scanning_configuration}
         * @return {@code this}
         */
        public Builder imageScanningConfiguration(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration imageScanningConfiguration) {
            this.imageScanningConfiguration = imageScanningConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getImageTestsConfiguration}
         * @param imageTestsConfiguration image_tests_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#image_tests_configuration ImagebuilderImagePipeline#image_tests_configuration}
         * @return {@code this}
         */
        public Builder imageTestsConfiguration(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration imageTestsConfiguration) {
            this.imageTestsConfiguration = imageTestsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getSchedule}
         * @param schedule schedule block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#schedule ImagebuilderImagePipeline#schedule}
         * @return {@code this}
         */
        public Builder schedule(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineSchedule schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#status ImagebuilderImagePipeline#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#tags ImagebuilderImagePipeline#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#tags_all ImagebuilderImagePipeline#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getWorkflow}
         * @param workflow workflow block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#workflow ImagebuilderImagePipeline#workflow}
         * @return {@code this}
         */
        public Builder workflow(com.hashicorp.cdktf.IResolvable workflow) {
            this.workflow = workflow;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getWorkflow}
         * @param workflow workflow block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#workflow ImagebuilderImagePipeline#workflow}
         * @return {@code this}
         */
        public Builder workflow(java.util.List<? extends imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineWorkflow> workflow) {
            this.workflow = workflow;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getDependsOn}
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
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineConfig#getProvisioners}
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
         * @return a new instance of {@link ImagebuilderImagePipelineConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImagePipelineConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImagePipelineConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImagePipelineConfig {
        private final java.lang.String infrastructureConfigurationArn;
        private final java.lang.String name;
        private final java.lang.String containerRecipeArn;
        private final java.lang.String description;
        private final java.lang.String distributionConfigurationArn;
        private final java.lang.Object enhancedImageMetadataEnabled;
        private final java.lang.String executionRole;
        private final java.lang.String id;
        private final java.lang.String imageRecipeArn;
        private final imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration imageScanningConfiguration;
        private final imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration imageTestsConfiguration;
        private final imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineSchedule schedule;
        private final java.lang.String status;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object workflow;
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
            this.infrastructureConfigurationArn = software.amazon.jsii.Kernel.get(this, "infrastructureConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.containerRecipeArn = software.amazon.jsii.Kernel.get(this, "containerRecipeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.distributionConfigurationArn = software.amazon.jsii.Kernel.get(this, "distributionConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enhancedImageMetadataEnabled = software.amazon.jsii.Kernel.get(this, "enhancedImageMetadataEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.executionRole = software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageRecipeArn = software.amazon.jsii.Kernel.get(this, "imageRecipeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageScanningConfiguration = software.amazon.jsii.Kernel.get(this, "imageScanningConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration.class));
            this.imageTestsConfiguration = software.amazon.jsii.Kernel.get(this, "imageTestsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration.class));
            this.schedule = software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineSchedule.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.workflow = software.amazon.jsii.Kernel.get(this, "workflow", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.infrastructureConfigurationArn = java.util.Objects.requireNonNull(builder.infrastructureConfigurationArn, "infrastructureConfigurationArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.containerRecipeArn = builder.containerRecipeArn;
            this.description = builder.description;
            this.distributionConfigurationArn = builder.distributionConfigurationArn;
            this.enhancedImageMetadataEnabled = builder.enhancedImageMetadataEnabled;
            this.executionRole = builder.executionRole;
            this.id = builder.id;
            this.imageRecipeArn = builder.imageRecipeArn;
            this.imageScanningConfiguration = builder.imageScanningConfiguration;
            this.imageTestsConfiguration = builder.imageTestsConfiguration;
            this.schedule = builder.schedule;
            this.status = builder.status;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.workflow = builder.workflow;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getInfrastructureConfigurationArn() {
            return this.infrastructureConfigurationArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getContainerRecipeArn() {
            return this.containerRecipeArn;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDistributionConfigurationArn() {
            return this.distributionConfigurationArn;
        }

        @Override
        public final java.lang.Object getEnhancedImageMetadataEnabled() {
            return this.enhancedImageMetadataEnabled;
        }

        @Override
        public final java.lang.String getExecutionRole() {
            return this.executionRole;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getImageRecipeArn() {
            return this.imageRecipeArn;
        }

        @Override
        public final imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration getImageScanningConfiguration() {
            return this.imageScanningConfiguration;
        }

        @Override
        public final imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration getImageTestsConfiguration() {
            return this.imageTestsConfiguration;
        }

        @Override
        public final imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineSchedule getSchedule() {
            return this.schedule;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
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
        public final java.lang.Object getWorkflow() {
            return this.workflow;
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

            data.set("infrastructureConfigurationArn", om.valueToTree(this.getInfrastructureConfigurationArn()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getContainerRecipeArn() != null) {
                data.set("containerRecipeArn", om.valueToTree(this.getContainerRecipeArn()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDistributionConfigurationArn() != null) {
                data.set("distributionConfigurationArn", om.valueToTree(this.getDistributionConfigurationArn()));
            }
            if (this.getEnhancedImageMetadataEnabled() != null) {
                data.set("enhancedImageMetadataEnabled", om.valueToTree(this.getEnhancedImageMetadataEnabled()));
            }
            if (this.getExecutionRole() != null) {
                data.set("executionRole", om.valueToTree(this.getExecutionRole()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImageRecipeArn() != null) {
                data.set("imageRecipeArn", om.valueToTree(this.getImageRecipeArn()));
            }
            if (this.getImageScanningConfiguration() != null) {
                data.set("imageScanningConfiguration", om.valueToTree(this.getImageScanningConfiguration()));
            }
            if (this.getImageTestsConfiguration() != null) {
                data.set("imageTestsConfiguration", om.valueToTree(this.getImageTestsConfiguration()));
            }
            if (this.getSchedule() != null) {
                data.set("schedule", om.valueToTree(this.getSchedule()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getWorkflow() != null) {
                data.set("workflow", om.valueToTree(this.getWorkflow()));
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
            struct.set("fqn", om.valueToTree("aws.imagebuilderImagePipeline.ImagebuilderImagePipelineConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImagePipelineConfig.Jsii$Proxy that = (ImagebuilderImagePipelineConfig.Jsii$Proxy) o;

            if (!infrastructureConfigurationArn.equals(that.infrastructureConfigurationArn)) return false;
            if (!name.equals(that.name)) return false;
            if (this.containerRecipeArn != null ? !this.containerRecipeArn.equals(that.containerRecipeArn) : that.containerRecipeArn != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.distributionConfigurationArn != null ? !this.distributionConfigurationArn.equals(that.distributionConfigurationArn) : that.distributionConfigurationArn != null) return false;
            if (this.enhancedImageMetadataEnabled != null ? !this.enhancedImageMetadataEnabled.equals(that.enhancedImageMetadataEnabled) : that.enhancedImageMetadataEnabled != null) return false;
            if (this.executionRole != null ? !this.executionRole.equals(that.executionRole) : that.executionRole != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.imageRecipeArn != null ? !this.imageRecipeArn.equals(that.imageRecipeArn) : that.imageRecipeArn != null) return false;
            if (this.imageScanningConfiguration != null ? !this.imageScanningConfiguration.equals(that.imageScanningConfiguration) : that.imageScanningConfiguration != null) return false;
            if (this.imageTestsConfiguration != null ? !this.imageTestsConfiguration.equals(that.imageTestsConfiguration) : that.imageTestsConfiguration != null) return false;
            if (this.schedule != null ? !this.schedule.equals(that.schedule) : that.schedule != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.workflow != null ? !this.workflow.equals(that.workflow) : that.workflow != null) return false;
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
            int result = this.infrastructureConfigurationArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.containerRecipeArn != null ? this.containerRecipeArn.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.distributionConfigurationArn != null ? this.distributionConfigurationArn.hashCode() : 0);
            result = 31 * result + (this.enhancedImageMetadataEnabled != null ? this.enhancedImageMetadataEnabled.hashCode() : 0);
            result = 31 * result + (this.executionRole != null ? this.executionRole.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.imageRecipeArn != null ? this.imageRecipeArn.hashCode() : 0);
            result = 31 * result + (this.imageScanningConfiguration != null ? this.imageScanningConfiguration.hashCode() : 0);
            result = 31 * result + (this.imageTestsConfiguration != null ? this.imageTestsConfiguration.hashCode() : 0);
            result = 31 * result + (this.schedule != null ? this.schedule.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.workflow != null ? this.workflow.hashCode() : 0);
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
