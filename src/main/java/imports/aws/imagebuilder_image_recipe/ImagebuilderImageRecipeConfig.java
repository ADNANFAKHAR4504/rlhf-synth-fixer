package imports.aws.imagebuilder_image_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.361Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImageRecipe.ImagebuilderImageRecipeConfig")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImageRecipeConfig.Jsii$Proxy.class)
public interface ImagebuilderImageRecipeConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * component block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#component ImagebuilderImageRecipe#component}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getComponent();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#name ImagebuilderImageRecipe#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#parent_image ImagebuilderImageRecipe#parent_image}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getParentImage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#version ImagebuilderImageRecipe#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersion();

    /**
     * block_device_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#block_device_mapping ImagebuilderImageRecipe#block_device_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBlockDeviceMapping() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#description ImagebuilderImageRecipe#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#id ImagebuilderImageRecipe#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * systems_manager_agent block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#systems_manager_agent ImagebuilderImageRecipe#systems_manager_agent}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent getSystemsManagerAgent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#tags ImagebuilderImageRecipe#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#tags_all ImagebuilderImageRecipe#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#user_data_base64 ImagebuilderImageRecipe#user_data_base64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserDataBase64() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#working_directory ImagebuilderImageRecipe#working_directory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkingDirectory() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImageRecipeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImageRecipeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImageRecipeConfig> {
        java.lang.Object component;
        java.lang.String name;
        java.lang.String parentImage;
        java.lang.String version;
        java.lang.Object blockDeviceMapping;
        java.lang.String description;
        java.lang.String id;
        imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent systemsManagerAgent;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String userDataBase64;
        java.lang.String workingDirectory;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getComponent}
         * @param component component block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#component ImagebuilderImageRecipe#component}
         * @return {@code this}
         */
        public Builder component(com.hashicorp.cdktf.IResolvable component) {
            this.component = component;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getComponent}
         * @param component component block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#component ImagebuilderImageRecipe#component}
         * @return {@code this}
         */
        public Builder component(java.util.List<? extends imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeComponent> component) {
            this.component = component;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#name ImagebuilderImageRecipe#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getParentImage}
         * @param parentImage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#parent_image ImagebuilderImageRecipe#parent_image}. This parameter is required.
         * @return {@code this}
         */
        public Builder parentImage(java.lang.String parentImage) {
            this.parentImage = parentImage;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#version ImagebuilderImageRecipe#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getBlockDeviceMapping}
         * @param blockDeviceMapping block_device_mapping block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#block_device_mapping ImagebuilderImageRecipe#block_device_mapping}
         * @return {@code this}
         */
        public Builder blockDeviceMapping(com.hashicorp.cdktf.IResolvable blockDeviceMapping) {
            this.blockDeviceMapping = blockDeviceMapping;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getBlockDeviceMapping}
         * @param blockDeviceMapping block_device_mapping block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#block_device_mapping ImagebuilderImageRecipe#block_device_mapping}
         * @return {@code this}
         */
        public Builder blockDeviceMapping(java.util.List<? extends imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeBlockDeviceMapping> blockDeviceMapping) {
            this.blockDeviceMapping = blockDeviceMapping;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#description ImagebuilderImageRecipe#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#id ImagebuilderImageRecipe#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getSystemsManagerAgent}
         * @param systemsManagerAgent systems_manager_agent block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#systems_manager_agent ImagebuilderImageRecipe#systems_manager_agent}
         * @return {@code this}
         */
        public Builder systemsManagerAgent(imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent systemsManagerAgent) {
            this.systemsManagerAgent = systemsManagerAgent;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#tags ImagebuilderImageRecipe#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#tags_all ImagebuilderImageRecipe#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getUserDataBase64}
         * @param userDataBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#user_data_base64 ImagebuilderImageRecipe#user_data_base64}.
         * @return {@code this}
         */
        public Builder userDataBase64(java.lang.String userDataBase64) {
            this.userDataBase64 = userDataBase64;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getWorkingDirectory}
         * @param workingDirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#working_directory ImagebuilderImageRecipe#working_directory}.
         * @return {@code this}
         */
        public Builder workingDirectory(java.lang.String workingDirectory) {
            this.workingDirectory = workingDirectory;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getDependsOn}
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
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeConfig#getProvisioners}
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
         * @return a new instance of {@link ImagebuilderImageRecipeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImageRecipeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImageRecipeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImageRecipeConfig {
        private final java.lang.Object component;
        private final java.lang.String name;
        private final java.lang.String parentImage;
        private final java.lang.String version;
        private final java.lang.Object blockDeviceMapping;
        private final java.lang.String description;
        private final java.lang.String id;
        private final imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent systemsManagerAgent;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String userDataBase64;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parentImage = software.amazon.jsii.Kernel.get(this, "parentImage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.blockDeviceMapping = software.amazon.jsii.Kernel.get(this, "blockDeviceMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.systemsManagerAgent = software.amazon.jsii.Kernel.get(this, "systemsManagerAgent", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.userDataBase64 = software.amazon.jsii.Kernel.get(this, "userDataBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.parentImage = java.util.Objects.requireNonNull(builder.parentImage, "parentImage is required");
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
            this.blockDeviceMapping = builder.blockDeviceMapping;
            this.description = builder.description;
            this.id = builder.id;
            this.systemsManagerAgent = builder.systemsManagerAgent;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.userDataBase64 = builder.userDataBase64;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getParentImage() {
            return this.parentImage;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final java.lang.Object getBlockDeviceMapping() {
            return this.blockDeviceMapping;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent getSystemsManagerAgent() {
            return this.systemsManagerAgent;
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
        public final java.lang.String getUserDataBase64() {
            return this.userDataBase64;
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
            data.set("name", om.valueToTree(this.getName()));
            data.set("parentImage", om.valueToTree(this.getParentImage()));
            data.set("version", om.valueToTree(this.getVersion()));
            if (this.getBlockDeviceMapping() != null) {
                data.set("blockDeviceMapping", om.valueToTree(this.getBlockDeviceMapping()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getSystemsManagerAgent() != null) {
                data.set("systemsManagerAgent", om.valueToTree(this.getSystemsManagerAgent()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getUserDataBase64() != null) {
                data.set("userDataBase64", om.valueToTree(this.getUserDataBase64()));
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
            struct.set("fqn", om.valueToTree("aws.imagebuilderImageRecipe.ImagebuilderImageRecipeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImageRecipeConfig.Jsii$Proxy that = (ImagebuilderImageRecipeConfig.Jsii$Proxy) o;

            if (!component.equals(that.component)) return false;
            if (!name.equals(that.name)) return false;
            if (!parentImage.equals(that.parentImage)) return false;
            if (!version.equals(that.version)) return false;
            if (this.blockDeviceMapping != null ? !this.blockDeviceMapping.equals(that.blockDeviceMapping) : that.blockDeviceMapping != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.systemsManagerAgent != null ? !this.systemsManagerAgent.equals(that.systemsManagerAgent) : that.systemsManagerAgent != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.userDataBase64 != null ? !this.userDataBase64.equals(that.userDataBase64) : that.userDataBase64 != null) return false;
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
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.parentImage.hashCode());
            result = 31 * result + (this.version.hashCode());
            result = 31 * result + (this.blockDeviceMapping != null ? this.blockDeviceMapping.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.systemsManagerAgent != null ? this.systemsManagerAgent.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.userDataBase64 != null ? this.userDataBase64.hashCode() : 0);
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
