package imports.aws.codepipeline_custom_action_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.336Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineCustomActionType.CodepipelineCustomActionTypeConfig")
@software.amazon.jsii.Jsii.Proxy(CodepipelineCustomActionTypeConfig.Jsii$Proxy.class)
public interface CodepipelineCustomActionTypeConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#category CodepipelineCustomActionType#category}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCategory();

    /**
     * input_artifact_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#input_artifact_details CodepipelineCustomActionType#input_artifact_details}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails getInputArtifactDetails();

    /**
     * output_artifact_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#output_artifact_details CodepipelineCustomActionType#output_artifact_details}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails getOutputArtifactDetails();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#provider_name CodepipelineCustomActionType#provider_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProviderName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#version CodepipelineCustomActionType#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersion();

    /**
     * configuration_property block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#configuration_property CodepipelineCustomActionType#configuration_property}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfigurationProperty() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#id CodepipelineCustomActionType#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#settings CodepipelineCustomActionType#settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings getSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#tags CodepipelineCustomActionType#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#tags_all CodepipelineCustomActionType#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineCustomActionTypeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineCustomActionTypeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineCustomActionTypeConfig> {
        java.lang.String category;
        imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails inputArtifactDetails;
        imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails outputArtifactDetails;
        java.lang.String providerName;
        java.lang.String version;
        java.lang.Object configurationProperty;
        java.lang.String id;
        imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings settings;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getCategory}
         * @param category Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#category CodepipelineCustomActionType#category}. This parameter is required.
         * @return {@code this}
         */
        public Builder category(java.lang.String category) {
            this.category = category;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getInputArtifactDetails}
         * @param inputArtifactDetails input_artifact_details block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#input_artifact_details CodepipelineCustomActionType#input_artifact_details}
         * @return {@code this}
         */
        public Builder inputArtifactDetails(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails inputArtifactDetails) {
            this.inputArtifactDetails = inputArtifactDetails;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getOutputArtifactDetails}
         * @param outputArtifactDetails output_artifact_details block. This parameter is required.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#output_artifact_details CodepipelineCustomActionType#output_artifact_details}
         * @return {@code this}
         */
        public Builder outputArtifactDetails(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails outputArtifactDetails) {
            this.outputArtifactDetails = outputArtifactDetails;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getProviderName}
         * @param providerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#provider_name CodepipelineCustomActionType#provider_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder providerName(java.lang.String providerName) {
            this.providerName = providerName;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#version CodepipelineCustomActionType#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getConfigurationProperty}
         * @param configurationProperty configuration_property block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#configuration_property CodepipelineCustomActionType#configuration_property}
         * @return {@code this}
         */
        public Builder configurationProperty(com.hashicorp.cdktf.IResolvable configurationProperty) {
            this.configurationProperty = configurationProperty;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getConfigurationProperty}
         * @param configurationProperty configuration_property block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#configuration_property CodepipelineCustomActionType#configuration_property}
         * @return {@code this}
         */
        public Builder configurationProperty(java.util.List<? extends imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfigurationProperty> configurationProperty) {
            this.configurationProperty = configurationProperty;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#id CodepipelineCustomActionType#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getSettings}
         * @param settings settings block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#settings CodepipelineCustomActionType#settings}
         * @return {@code this}
         */
        public Builder settings(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings settings) {
            this.settings = settings;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#tags CodepipelineCustomActionType#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#tags_all CodepipelineCustomActionType#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getDependsOn}
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
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfig#getProvisioners}
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
         * @return a new instance of {@link CodepipelineCustomActionTypeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineCustomActionTypeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineCustomActionTypeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineCustomActionTypeConfig {
        private final java.lang.String category;
        private final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails inputArtifactDetails;
        private final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails outputArtifactDetails;
        private final java.lang.String providerName;
        private final java.lang.String version;
        private final java.lang.Object configurationProperty;
        private final java.lang.String id;
        private final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings settings;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.category = software.amazon.jsii.Kernel.get(this, "category", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputArtifactDetails = software.amazon.jsii.Kernel.get(this, "inputArtifactDetails", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails.class));
            this.outputArtifactDetails = software.amazon.jsii.Kernel.get(this, "outputArtifactDetails", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails.class));
            this.providerName = software.amazon.jsii.Kernel.get(this, "providerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configurationProperty = software.amazon.jsii.Kernel.get(this, "configurationProperty", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.settings = software.amazon.jsii.Kernel.get(this, "settings", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.category = java.util.Objects.requireNonNull(builder.category, "category is required");
            this.inputArtifactDetails = java.util.Objects.requireNonNull(builder.inputArtifactDetails, "inputArtifactDetails is required");
            this.outputArtifactDetails = java.util.Objects.requireNonNull(builder.outputArtifactDetails, "outputArtifactDetails is required");
            this.providerName = java.util.Objects.requireNonNull(builder.providerName, "providerName is required");
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
            this.configurationProperty = builder.configurationProperty;
            this.id = builder.id;
            this.settings = builder.settings;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCategory() {
            return this.category;
        }

        @Override
        public final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails getInputArtifactDetails() {
            return this.inputArtifactDetails;
        }

        @Override
        public final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails getOutputArtifactDetails() {
            return this.outputArtifactDetails;
        }

        @Override
        public final java.lang.String getProviderName() {
            return this.providerName;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final java.lang.Object getConfigurationProperty() {
            return this.configurationProperty;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings getSettings() {
            return this.settings;
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

            data.set("category", om.valueToTree(this.getCategory()));
            data.set("inputArtifactDetails", om.valueToTree(this.getInputArtifactDetails()));
            data.set("outputArtifactDetails", om.valueToTree(this.getOutputArtifactDetails()));
            data.set("providerName", om.valueToTree(this.getProviderName()));
            data.set("version", om.valueToTree(this.getVersion()));
            if (this.getConfigurationProperty() != null) {
                data.set("configurationProperty", om.valueToTree(this.getConfigurationProperty()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getSettings() != null) {
                data.set("settings", om.valueToTree(this.getSettings()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.codepipelineCustomActionType.CodepipelineCustomActionTypeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineCustomActionTypeConfig.Jsii$Proxy that = (CodepipelineCustomActionTypeConfig.Jsii$Proxy) o;

            if (!category.equals(that.category)) return false;
            if (!inputArtifactDetails.equals(that.inputArtifactDetails)) return false;
            if (!outputArtifactDetails.equals(that.outputArtifactDetails)) return false;
            if (!providerName.equals(that.providerName)) return false;
            if (!version.equals(that.version)) return false;
            if (this.configurationProperty != null ? !this.configurationProperty.equals(that.configurationProperty) : that.configurationProperty != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.settings != null ? !this.settings.equals(that.settings) : that.settings != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.category.hashCode();
            result = 31 * result + (this.inputArtifactDetails.hashCode());
            result = 31 * result + (this.outputArtifactDetails.hashCode());
            result = 31 * result + (this.providerName.hashCode());
            result = 31 * result + (this.version.hashCode());
            result = 31 * result + (this.configurationProperty != null ? this.configurationProperty.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.settings != null ? this.settings.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
