package imports.aws.sagemaker_app_image_config;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config aws_sagemaker_app_image_config}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.295Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerAppImageConfig.SagemakerAppImageConfig")
public class SagemakerAppImageConfig extends com.hashicorp.cdktf.TerraformResource {

    protected SagemakerAppImageConfig(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerAppImageConfig(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfig.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config aws_sagemaker_app_image_config} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SagemakerAppImageConfig(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SagemakerAppImageConfig resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SagemakerAppImageConfig to import. This parameter is required.
     * @param importFromId The id of the existing SagemakerAppImageConfig that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SagemakerAppImageConfig to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfig.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SagemakerAppImageConfig resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SagemakerAppImageConfig to import. This parameter is required.
     * @param importFromId The id of the existing SagemakerAppImageConfig that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfig.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCodeEditorAppImageConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCodeEditorAppImageConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJupyterLabImageConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfig value) {
        software.amazon.jsii.Kernel.call(this, "putJupyterLabImageConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKernelGatewayImageConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfig value) {
        software.amazon.jsii.Kernel.call(this, "putKernelGatewayImageConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCodeEditorAppImageConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCodeEditorAppImageConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJupyterLabImageConfig() {
        software.amazon.jsii.Kernel.call(this, "resetJupyterLabImageConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKernelGatewayImageConfig() {
        software.amazon.jsii.Kernel.call(this, "resetKernelGatewayImageConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigOutputReference getCodeEditorAppImageConfig() {
        return software.amazon.jsii.Kernel.get(this, "codeEditorAppImageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigOutputReference getJupyterLabImageConfig() {
        return software.amazon.jsii.Kernel.get(this, "jupyterLabImageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigOutputReference getKernelGatewayImageConfig() {
        return software.amazon.jsii.Kernel.get(this, "kernelGatewayImageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppImageConfigNameInput() {
        return software.amazon.jsii.Kernel.get(this, "appImageConfigNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfig getCodeEditorAppImageConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "codeEditorAppImageConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfig getJupyterLabImageConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "jupyterLabImageConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfig getKernelGatewayImageConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "kernelGatewayImageConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppImageConfigName() {
        return software.amazon.jsii.Kernel.get(this, "appImageConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppImageConfigName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appImageConfigName", java.util.Objects.requireNonNull(value, "appImageConfigName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
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
     * A fluent builder for {@link imports.aws.sagemaker_app_image_config.SagemakerAppImageConfig}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sagemaker_app_image_config.SagemakerAppImageConfig> {
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
        private final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#app_image_config_name SagemakerAppImageConfig#app_image_config_name}.
         * <p>
         * @return {@code this}
         * @param appImageConfigName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#app_image_config_name SagemakerAppImageConfig#app_image_config_name}. This parameter is required.
         */
        public Builder appImageConfigName(final java.lang.String appImageConfigName) {
            this.config.appImageConfigName(appImageConfigName);
            return this;
        }

        /**
         * code_editor_app_image_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#code_editor_app_image_config SagemakerAppImageConfig#code_editor_app_image_config}
         * <p>
         * @return {@code this}
         * @param codeEditorAppImageConfig code_editor_app_image_config block. This parameter is required.
         */
        public Builder codeEditorAppImageConfig(final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfig codeEditorAppImageConfig) {
            this.config.codeEditorAppImageConfig(codeEditorAppImageConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#id SagemakerAppImageConfig#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#id SagemakerAppImageConfig#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * jupyter_lab_image_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#jupyter_lab_image_config SagemakerAppImageConfig#jupyter_lab_image_config}
         * <p>
         * @return {@code this}
         * @param jupyterLabImageConfig jupyter_lab_image_config block. This parameter is required.
         */
        public Builder jupyterLabImageConfig(final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfig jupyterLabImageConfig) {
            this.config.jupyterLabImageConfig(jupyterLabImageConfig);
            return this;
        }

        /**
         * kernel_gateway_image_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_gateway_image_config SagemakerAppImageConfig#kernel_gateway_image_config}
         * <p>
         * @return {@code this}
         * @param kernelGatewayImageConfig kernel_gateway_image_config block. This parameter is required.
         */
        public Builder kernelGatewayImageConfig(final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfig kernelGatewayImageConfig) {
            this.config.kernelGatewayImageConfig(kernelGatewayImageConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags SagemakerAppImageConfig#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags SagemakerAppImageConfig#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags_all SagemakerAppImageConfig#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags_all SagemakerAppImageConfig#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sagemaker_app_image_config.SagemakerAppImageConfig}.
         */
        @Override
        public imports.aws.sagemaker_app_image_config.SagemakerAppImageConfig build() {
            return new imports.aws.sagemaker_app_image_config.SagemakerAppImageConfig(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
