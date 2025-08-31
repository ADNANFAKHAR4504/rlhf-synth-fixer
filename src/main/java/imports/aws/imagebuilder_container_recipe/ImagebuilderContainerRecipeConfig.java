package imports.aws.imagebuilder_container_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.349Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeConfig")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderContainerRecipeConfig.Jsii$Proxy.class)
public interface ImagebuilderContainerRecipeConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * component block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#component ImagebuilderContainerRecipe#component}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getComponent();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#container_type ImagebuilderContainerRecipe#container_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContainerType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#name ImagebuilderContainerRecipe#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#parent_image ImagebuilderContainerRecipe#parent_image}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getParentImage();

    /**
     * target_repository block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#target_repository ImagebuilderContainerRecipe#target_repository}
     */
    @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeTargetRepository getTargetRepository();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#version ImagebuilderContainerRecipe#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#description ImagebuilderContainerRecipe#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#dockerfile_template_data ImagebuilderContainerRecipe#dockerfile_template_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDockerfileTemplateData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#dockerfile_template_uri ImagebuilderContainerRecipe#dockerfile_template_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDockerfileTemplateUri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#id ImagebuilderContainerRecipe#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * instance_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#instance_configuration ImagebuilderContainerRecipe#instance_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration getInstanceConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#kms_key_id ImagebuilderContainerRecipe#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#platform_override ImagebuilderContainerRecipe#platform_override}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatformOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#tags ImagebuilderContainerRecipe#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#tags_all ImagebuilderContainerRecipe#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#working_directory ImagebuilderContainerRecipe#working_directory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkingDirectory() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderContainerRecipeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderContainerRecipeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderContainerRecipeConfig> {
        java.lang.Object component;
        java.lang.String containerType;
        java.lang.String name;
        java.lang.String parentImage;
        imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeTargetRepository targetRepository;
        java.lang.String version;
        java.lang.String description;
        java.lang.String dockerfileTemplateData;
        java.lang.String dockerfileTemplateUri;
        java.lang.String id;
        imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration instanceConfiguration;
        java.lang.String kmsKeyId;
        java.lang.String platformOverride;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String workingDirectory;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getComponent}
         * @param component component block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#component ImagebuilderContainerRecipe#component}
         * @return {@code this}
         */
        public Builder component(com.hashicorp.cdktf.IResolvable component) {
            this.component = component;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getComponent}
         * @param component component block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#component ImagebuilderContainerRecipe#component}
         * @return {@code this}
         */
        public Builder component(java.util.List<? extends imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeComponent> component) {
            this.component = component;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getContainerType}
         * @param containerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#container_type ImagebuilderContainerRecipe#container_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder containerType(java.lang.String containerType) {
            this.containerType = containerType;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#name ImagebuilderContainerRecipe#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getParentImage}
         * @param parentImage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#parent_image ImagebuilderContainerRecipe#parent_image}. This parameter is required.
         * @return {@code this}
         */
        public Builder parentImage(java.lang.String parentImage) {
            this.parentImage = parentImage;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getTargetRepository}
         * @param targetRepository target_repository block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#target_repository ImagebuilderContainerRecipe#target_repository}
         * @return {@code this}
         */
        public Builder targetRepository(imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeTargetRepository targetRepository) {
            this.targetRepository = targetRepository;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#version ImagebuilderContainerRecipe#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#description ImagebuilderContainerRecipe#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getDockerfileTemplateData}
         * @param dockerfileTemplateData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#dockerfile_template_data ImagebuilderContainerRecipe#dockerfile_template_data}.
         * @return {@code this}
         */
        public Builder dockerfileTemplateData(java.lang.String dockerfileTemplateData) {
            this.dockerfileTemplateData = dockerfileTemplateData;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getDockerfileTemplateUri}
         * @param dockerfileTemplateUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#dockerfile_template_uri ImagebuilderContainerRecipe#dockerfile_template_uri}.
         * @return {@code this}
         */
        public Builder dockerfileTemplateUri(java.lang.String dockerfileTemplateUri) {
            this.dockerfileTemplateUri = dockerfileTemplateUri;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#id ImagebuilderContainerRecipe#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getInstanceConfiguration}
         * @param instanceConfiguration instance_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#instance_configuration ImagebuilderContainerRecipe#instance_configuration}
         * @return {@code this}
         */
        public Builder instanceConfiguration(imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration instanceConfiguration) {
            this.instanceConfiguration = instanceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#kms_key_id ImagebuilderContainerRecipe#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getPlatformOverride}
         * @param platformOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#platform_override ImagebuilderContainerRecipe#platform_override}.
         * @return {@code this}
         */
        public Builder platformOverride(java.lang.String platformOverride) {
            this.platformOverride = platformOverride;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#tags ImagebuilderContainerRecipe#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#tags_all ImagebuilderContainerRecipe#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getWorkingDirectory}
         * @param workingDirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#working_directory ImagebuilderContainerRecipe#working_directory}.
         * @return {@code this}
         */
        public Builder workingDirectory(java.lang.String workingDirectory) {
            this.workingDirectory = workingDirectory;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getDependsOn}
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
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeConfig#getProvisioners}
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
         * @return a new instance of {@link ImagebuilderContainerRecipeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderContainerRecipeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderContainerRecipeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderContainerRecipeConfig {
        private final java.lang.Object component;
        private final java.lang.String containerType;
        private final java.lang.String name;
        private final java.lang.String parentImage;
        private final imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeTargetRepository targetRepository;
        private final java.lang.String version;
        private final java.lang.String description;
        private final java.lang.String dockerfileTemplateData;
        private final java.lang.String dockerfileTemplateUri;
        private final java.lang.String id;
        private final imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration instanceConfiguration;
        private final java.lang.String kmsKeyId;
        private final java.lang.String platformOverride;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String workingDirectory;
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
            this.component = software.amazon.jsii.Kernel.get(this, "component", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.containerType = software.amazon.jsii.Kernel.get(this, "containerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parentImage = software.amazon.jsii.Kernel.get(this, "parentImage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetRepository = software.amazon.jsii.Kernel.get(this, "targetRepository", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeTargetRepository.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dockerfileTemplateData = software.amazon.jsii.Kernel.get(this, "dockerfileTemplateData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dockerfileTemplateUri = software.amazon.jsii.Kernel.get(this, "dockerfileTemplateUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceConfiguration = software.amazon.jsii.Kernel.get(this, "instanceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.platformOverride = software.amazon.jsii.Kernel.get(this, "platformOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.workingDirectory = software.amazon.jsii.Kernel.get(this, "workingDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.component = java.util.Objects.requireNonNull(builder.component, "component is required");
            this.containerType = java.util.Objects.requireNonNull(builder.containerType, "containerType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.parentImage = java.util.Objects.requireNonNull(builder.parentImage, "parentImage is required");
            this.targetRepository = java.util.Objects.requireNonNull(builder.targetRepository, "targetRepository is required");
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
            this.description = builder.description;
            this.dockerfileTemplateData = builder.dockerfileTemplateData;
            this.dockerfileTemplateUri = builder.dockerfileTemplateUri;
            this.id = builder.id;
            this.instanceConfiguration = builder.instanceConfiguration;
            this.kmsKeyId = builder.kmsKeyId;
            this.platformOverride = builder.platformOverride;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.workingDirectory = builder.workingDirectory;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getComponent() {
            return this.component;
        }

        @Override
        public final java.lang.String getContainerType() {
            return this.containerType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getParentImage() {
            return this.parentImage;
        }

        @Override
        public final imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeTargetRepository getTargetRepository() {
            return this.targetRepository;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDockerfileTemplateData() {
            return this.dockerfileTemplateData;
        }

        @Override
        public final java.lang.String getDockerfileTemplateUri() {
            return this.dockerfileTemplateUri;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration getInstanceConfiguration() {
            return this.instanceConfiguration;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getPlatformOverride() {
            return this.platformOverride;
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
        public final java.lang.String getWorkingDirectory() {
            return this.workingDirectory;
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

            data.set("component", om.valueToTree(this.getComponent()));
            data.set("containerType", om.valueToTree(this.getContainerType()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("parentImage", om.valueToTree(this.getParentImage()));
            data.set("targetRepository", om.valueToTree(this.getTargetRepository()));
            data.set("version", om.valueToTree(this.getVersion()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDockerfileTemplateData() != null) {
                data.set("dockerfileTemplateData", om.valueToTree(this.getDockerfileTemplateData()));
            }
            if (this.getDockerfileTemplateUri() != null) {
                data.set("dockerfileTemplateUri", om.valueToTree(this.getDockerfileTemplateUri()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceConfiguration() != null) {
                data.set("instanceConfiguration", om.valueToTree(this.getInstanceConfiguration()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getPlatformOverride() != null) {
                data.set("platformOverride", om.valueToTree(this.getPlatformOverride()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getWorkingDirectory() != null) {
                data.set("workingDirectory", om.valueToTree(this.getWorkingDirectory()));
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
            struct.set("fqn", om.valueToTree("aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderContainerRecipeConfig.Jsii$Proxy that = (ImagebuilderContainerRecipeConfig.Jsii$Proxy) o;

            if (!component.equals(that.component)) return false;
            if (!containerType.equals(that.containerType)) return false;
            if (!name.equals(that.name)) return false;
            if (!parentImage.equals(that.parentImage)) return false;
            if (!targetRepository.equals(that.targetRepository)) return false;
            if (!version.equals(that.version)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.dockerfileTemplateData != null ? !this.dockerfileTemplateData.equals(that.dockerfileTemplateData) : that.dockerfileTemplateData != null) return false;
            if (this.dockerfileTemplateUri != null ? !this.dockerfileTemplateUri.equals(that.dockerfileTemplateUri) : that.dockerfileTemplateUri != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceConfiguration != null ? !this.instanceConfiguration.equals(that.instanceConfiguration) : that.instanceConfiguration != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.platformOverride != null ? !this.platformOverride.equals(that.platformOverride) : that.platformOverride != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.workingDirectory != null ? !this.workingDirectory.equals(that.workingDirectory) : that.workingDirectory != null) return false;
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
            int result = this.component.hashCode();
            result = 31 * result + (this.containerType.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.parentImage.hashCode());
            result = 31 * result + (this.targetRepository.hashCode());
            result = 31 * result + (this.version.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.dockerfileTemplateData != null ? this.dockerfileTemplateData.hashCode() : 0);
            result = 31 * result + (this.dockerfileTemplateUri != null ? this.dockerfileTemplateUri.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceConfiguration != null ? this.instanceConfiguration.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.platformOverride != null ? this.platformOverride.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.workingDirectory != null ? this.workingDirectory.hashCode() : 0);
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
