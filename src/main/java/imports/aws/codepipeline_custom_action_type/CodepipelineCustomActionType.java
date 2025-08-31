package imports.aws.codepipeline_custom_action_type;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type aws_codepipeline_custom_action_type}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.335Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineCustomActionType.CodepipelineCustomActionType")
public class CodepipelineCustomActionType extends com.hashicorp.cdktf.TerraformResource {

    protected CodepipelineCustomActionType(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineCustomActionType(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionType.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type aws_codepipeline_custom_action_type} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CodepipelineCustomActionType(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CodepipelineCustomActionType resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodepipelineCustomActionType to import. This parameter is required.
     * @param importFromId The id of the existing CodepipelineCustomActionType that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CodepipelineCustomActionType to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionType.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CodepipelineCustomActionType resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodepipelineCustomActionType to import. This parameter is required.
     * @param importFromId The id of the existing CodepipelineCustomActionType that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionType.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putConfigurationProperty(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfigurationProperty>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfigurationProperty> __cast_cd4240 = (java.util.List<imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfigurationProperty>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfigurationProperty __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConfigurationProperty", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInputArtifactDetails(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails value) {
        software.amazon.jsii.Kernel.call(this, "putInputArtifactDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOutputArtifactDetails(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails value) {
        software.amazon.jsii.Kernel.call(this, "putOutputArtifactDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSettings(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings value) {
        software.amazon.jsii.Kernel.call(this, "putSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConfigurationProperty() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurationProperty", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfigurationPropertyList getConfigurationProperty() {
        return software.amazon.jsii.Kernel.get(this, "configurationProperty", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfigurationPropertyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetailsOutputReference getInputArtifactDetails() {
        return software.amazon.jsii.Kernel.get(this, "inputArtifactDetails", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetailsOutputReference getOutputArtifactDetails() {
        return software.amazon.jsii.Kernel.get(this, "outputArtifactDetails", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwner() {
        return software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettingsOutputReference getSettings() {
        return software.amazon.jsii.Kernel.get(this, "settings", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCategoryInput() {
        return software.amazon.jsii.Kernel.get(this, "categoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfigurationPropertyInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationPropertyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails getInputArtifactDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "inputArtifactDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails getOutputArtifactDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "outputArtifactDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProviderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "providerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings getSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "settingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCategory() {
        return software.amazon.jsii.Kernel.get(this, "category", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCategory(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "category", java.util.Objects.requireNonNull(value, "category is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProviderName() {
        return software.amazon.jsii.Kernel.get(this, "providerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProviderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "providerName", java.util.Objects.requireNonNull(value, "providerName is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "version", java.util.Objects.requireNonNull(value, "version is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionType}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionType> {
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
        private final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#category CodepipelineCustomActionType#category}.
         * <p>
         * @return {@code this}
         * @param category Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#category CodepipelineCustomActionType#category}. This parameter is required.
         */
        public Builder category(final java.lang.String category) {
            this.config.category(category);
            return this;
        }

        /**
         * input_artifact_details block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#input_artifact_details CodepipelineCustomActionType#input_artifact_details}
         * <p>
         * @return {@code this}
         * @param inputArtifactDetails input_artifact_details block. This parameter is required.
         */
        public Builder inputArtifactDetails(final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails inputArtifactDetails) {
            this.config.inputArtifactDetails(inputArtifactDetails);
            return this;
        }

        /**
         * output_artifact_details block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#output_artifact_details CodepipelineCustomActionType#output_artifact_details}
         * <p>
         * @return {@code this}
         * @param outputArtifactDetails output_artifact_details block. This parameter is required.
         */
        public Builder outputArtifactDetails(final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeOutputArtifactDetails outputArtifactDetails) {
            this.config.outputArtifactDetails(outputArtifactDetails);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#provider_name CodepipelineCustomActionType#provider_name}.
         * <p>
         * @return {@code this}
         * @param providerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#provider_name CodepipelineCustomActionType#provider_name}. This parameter is required.
         */
        public Builder providerName(final java.lang.String providerName) {
            this.config.providerName(providerName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#version CodepipelineCustomActionType#version}.
         * <p>
         * @return {@code this}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#version CodepipelineCustomActionType#version}. This parameter is required.
         */
        public Builder version(final java.lang.String version) {
            this.config.version(version);
            return this;
        }

        /**
         * configuration_property block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#configuration_property CodepipelineCustomActionType#configuration_property}
         * <p>
         * @return {@code this}
         * @param configurationProperty configuration_property block. This parameter is required.
         */
        public Builder configurationProperty(final com.hashicorp.cdktf.IResolvable configurationProperty) {
            this.config.configurationProperty(configurationProperty);
            return this;
        }
        /**
         * configuration_property block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#configuration_property CodepipelineCustomActionType#configuration_property}
         * <p>
         * @return {@code this}
         * @param configurationProperty configuration_property block. This parameter is required.
         */
        public Builder configurationProperty(final java.util.List<? extends imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeConfigurationProperty> configurationProperty) {
            this.config.configurationProperty(configurationProperty);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#id CodepipelineCustomActionType#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#id CodepipelineCustomActionType#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#settings CodepipelineCustomActionType#settings}
         * <p>
         * @return {@code this}
         * @param settings settings block. This parameter is required.
         */
        public Builder settings(final imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeSettings settings) {
            this.config.settings(settings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#tags CodepipelineCustomActionType#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#tags CodepipelineCustomActionType#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#tags_all CodepipelineCustomActionType#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#tags_all CodepipelineCustomActionType#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionType}.
         */
        @Override
        public imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionType build() {
            return new imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionType(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
