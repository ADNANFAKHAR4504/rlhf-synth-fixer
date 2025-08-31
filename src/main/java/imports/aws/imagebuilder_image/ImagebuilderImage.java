package imports.aws.imagebuilder_image;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image aws_imagebuilder_image}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImage.ImagebuilderImage")
public class ImagebuilderImage extends com.hashicorp.cdktf.TerraformResource {

    protected ImagebuilderImage(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderImage(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.imagebuilder_image.ImagebuilderImage.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image aws_imagebuilder_image} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ImagebuilderImage(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ImagebuilderImage resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ImagebuilderImage to import. This parameter is required.
     * @param importFromId The id of the existing ImagebuilderImage that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ImagebuilderImage to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.imagebuilder_image.ImagebuilderImage.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ImagebuilderImage resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ImagebuilderImage to import. This parameter is required.
     * @param importFromId The id of the existing ImagebuilderImage that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.imagebuilder_image.ImagebuilderImage.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putImageScanningConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putImageScanningConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putImageTestsConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageImageTestsConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putImageTestsConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkflow(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.imagebuilder_image.ImagebuilderImageWorkflow>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.imagebuilder_image.ImagebuilderImageWorkflow> __cast_cd4240 = (java.util.List<imports.aws.imagebuilder_image.ImagebuilderImageWorkflow>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.imagebuilder_image.ImagebuilderImageWorkflow __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWorkflow", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContainerRecipeArn() {
        software.amazon.jsii.Kernel.call(this, "resetContainerRecipeArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDistributionConfigurationArn() {
        software.amazon.jsii.Kernel.call(this, "resetDistributionConfigurationArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnhancedImageMetadataEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnhancedImageMetadataEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionRole() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageRecipeArn() {
        software.amazon.jsii.Kernel.call(this, "resetImageRecipeArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageScanningConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetImageScanningConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageTestsConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetImageTestsConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public void resetWorkflow() {
        software.amazon.jsii.Kernel.call(this, "resetWorkflow", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDateCreated() {
        return software.amazon.jsii.Kernel.get(this, "dateCreated", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationOutputReference getImageScanningConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "imageScanningConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageImageTestsConfigurationOutputReference getImageTestsConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "imageTestsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageImageTestsConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOsVersion() {
        return software.amazon.jsii.Kernel.get(this, "osVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageOutputResourcesList getOutputResources() {
        return software.amazon.jsii.Kernel.get(this, "outputResources", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageOutputResourcesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatform() {
        return software.amazon.jsii.Kernel.get(this, "platform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image.ImagebuilderImageWorkflowList getWorkflow() {
        return software.amazon.jsii.Kernel.get(this, "workflow", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageWorkflowList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContainerRecipeArnInput() {
        return software.amazon.jsii.Kernel.get(this, "containerRecipeArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDistributionConfigurationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "distributionConfigurationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnhancedImageMetadataEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enhancedImageMetadataEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageRecipeArnInput() {
        return software.amazon.jsii.Kernel.get(this, "imageRecipeArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfiguration getImageScanningConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "imageScanningConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image.ImagebuilderImageImageTestsConfiguration getImageTestsConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "imageTestsConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageImageTestsConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInfrastructureConfigurationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "infrastructureConfigurationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getWorkflowInput() {
        return software.amazon.jsii.Kernel.get(this, "workflowInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContainerRecipeArn() {
        return software.amazon.jsii.Kernel.get(this, "containerRecipeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContainerRecipeArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "containerRecipeArn", java.util.Objects.requireNonNull(value, "containerRecipeArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDistributionConfigurationArn() {
        return software.amazon.jsii.Kernel.get(this, "distributionConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDistributionConfigurationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "distributionConfigurationArn", java.util.Objects.requireNonNull(value, "distributionConfigurationArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnhancedImageMetadataEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enhancedImageMetadataEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnhancedImageMetadataEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enhancedImageMetadataEnabled", java.util.Objects.requireNonNull(value, "enhancedImageMetadataEnabled is required"));
    }

    public void setEnhancedImageMetadataEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enhancedImageMetadataEnabled", java.util.Objects.requireNonNull(value, "enhancedImageMetadataEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRole() {
        return software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRole", java.util.Objects.requireNonNull(value, "executionRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageRecipeArn() {
        return software.amazon.jsii.Kernel.get(this, "imageRecipeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageRecipeArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageRecipeArn", java.util.Objects.requireNonNull(value, "imageRecipeArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInfrastructureConfigurationArn() {
        return software.amazon.jsii.Kernel.get(this, "infrastructureConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInfrastructureConfigurationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "infrastructureConfigurationArn", java.util.Objects.requireNonNull(value, "infrastructureConfigurationArn is required"));
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

    /**
     * A fluent builder for {@link imports.aws.imagebuilder_image.ImagebuilderImage}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.imagebuilder_image.ImagebuilderImage> {
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
        private final imports.aws.imagebuilder_image.ImagebuilderImageConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.imagebuilder_image.ImagebuilderImageConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#infrastructure_configuration_arn ImagebuilderImage#infrastructure_configuration_arn}.
         * <p>
         * @return {@code this}
         * @param infrastructureConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#infrastructure_configuration_arn ImagebuilderImage#infrastructure_configuration_arn}. This parameter is required.
         */
        public Builder infrastructureConfigurationArn(final java.lang.String infrastructureConfigurationArn) {
            this.config.infrastructureConfigurationArn(infrastructureConfigurationArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#container_recipe_arn ImagebuilderImage#container_recipe_arn}.
         * <p>
         * @return {@code this}
         * @param containerRecipeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#container_recipe_arn ImagebuilderImage#container_recipe_arn}. This parameter is required.
         */
        public Builder containerRecipeArn(final java.lang.String containerRecipeArn) {
            this.config.containerRecipeArn(containerRecipeArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#distribution_configuration_arn ImagebuilderImage#distribution_configuration_arn}.
         * <p>
         * @return {@code this}
         * @param distributionConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#distribution_configuration_arn ImagebuilderImage#distribution_configuration_arn}. This parameter is required.
         */
        public Builder distributionConfigurationArn(final java.lang.String distributionConfigurationArn) {
            this.config.distributionConfigurationArn(distributionConfigurationArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#enhanced_image_metadata_enabled ImagebuilderImage#enhanced_image_metadata_enabled}.
         * <p>
         * @return {@code this}
         * @param enhancedImageMetadataEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#enhanced_image_metadata_enabled ImagebuilderImage#enhanced_image_metadata_enabled}. This parameter is required.
         */
        public Builder enhancedImageMetadataEnabled(final java.lang.Boolean enhancedImageMetadataEnabled) {
            this.config.enhancedImageMetadataEnabled(enhancedImageMetadataEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#enhanced_image_metadata_enabled ImagebuilderImage#enhanced_image_metadata_enabled}.
         * <p>
         * @return {@code this}
         * @param enhancedImageMetadataEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#enhanced_image_metadata_enabled ImagebuilderImage#enhanced_image_metadata_enabled}. This parameter is required.
         */
        public Builder enhancedImageMetadataEnabled(final com.hashicorp.cdktf.IResolvable enhancedImageMetadataEnabled) {
            this.config.enhancedImageMetadataEnabled(enhancedImageMetadataEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#execution_role ImagebuilderImage#execution_role}.
         * <p>
         * @return {@code this}
         * @param executionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#execution_role ImagebuilderImage#execution_role}. This parameter is required.
         */
        public Builder executionRole(final java.lang.String executionRole) {
            this.config.executionRole(executionRole);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#id ImagebuilderImage#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#id ImagebuilderImage#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_recipe_arn ImagebuilderImage#image_recipe_arn}.
         * <p>
         * @return {@code this}
         * @param imageRecipeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_recipe_arn ImagebuilderImage#image_recipe_arn}. This parameter is required.
         */
        public Builder imageRecipeArn(final java.lang.String imageRecipeArn) {
            this.config.imageRecipeArn(imageRecipeArn);
            return this;
        }

        /**
         * image_scanning_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_scanning_configuration ImagebuilderImage#image_scanning_configuration}
         * <p>
         * @return {@code this}
         * @param imageScanningConfiguration image_scanning_configuration block. This parameter is required.
         */
        public Builder imageScanningConfiguration(final imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfiguration imageScanningConfiguration) {
            this.config.imageScanningConfiguration(imageScanningConfiguration);
            return this;
        }

        /**
         * image_tests_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_tests_configuration ImagebuilderImage#image_tests_configuration}
         * <p>
         * @return {@code this}
         * @param imageTestsConfiguration image_tests_configuration block. This parameter is required.
         */
        public Builder imageTestsConfiguration(final imports.aws.imagebuilder_image.ImagebuilderImageImageTestsConfiguration imageTestsConfiguration) {
            this.config.imageTestsConfiguration(imageTestsConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#tags ImagebuilderImage#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#tags ImagebuilderImage#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#tags_all ImagebuilderImage#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#tags_all ImagebuilderImage#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#timeouts ImagebuilderImage#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.imagebuilder_image.ImagebuilderImageTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * workflow block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#workflow ImagebuilderImage#workflow}
         * <p>
         * @return {@code this}
         * @param workflow workflow block. This parameter is required.
         */
        public Builder workflow(final com.hashicorp.cdktf.IResolvable workflow) {
            this.config.workflow(workflow);
            return this;
        }
        /**
         * workflow block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#workflow ImagebuilderImage#workflow}
         * <p>
         * @return {@code this}
         * @param workflow workflow block. This parameter is required.
         */
        public Builder workflow(final java.util.List<? extends imports.aws.imagebuilder_image.ImagebuilderImageWorkflow> workflow) {
            this.config.workflow(workflow);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.imagebuilder_image.ImagebuilderImage}.
         */
        @Override
        public imports.aws.imagebuilder_image.ImagebuilderImage build() {
            return new imports.aws.imagebuilder_image.ImagebuilderImage(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
