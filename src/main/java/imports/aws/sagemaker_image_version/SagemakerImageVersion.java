package imports.aws.sagemaker_image_version;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version aws_sagemaker_image_version}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerImageVersion.SagemakerImageVersion")
public class SagemakerImageVersion extends com.hashicorp.cdktf.TerraformResource {

    protected SagemakerImageVersion(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerImageVersion(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sagemaker_image_version.SagemakerImageVersion.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version aws_sagemaker_image_version} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SagemakerImageVersion(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_image_version.SagemakerImageVersionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SagemakerImageVersion resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SagemakerImageVersion to import. This parameter is required.
     * @param importFromId The id of the existing SagemakerImageVersion that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SagemakerImageVersion to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sagemaker_image_version.SagemakerImageVersion.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SagemakerImageVersion resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SagemakerImageVersion to import. This parameter is required.
     * @param importFromId The id of the existing SagemakerImageVersion that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sagemaker_image_version.SagemakerImageVersion.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetHorovod() {
        software.amazon.jsii.Kernel.call(this, "resetHorovod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJobType() {
        software.amazon.jsii.Kernel.call(this, "resetJobType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMlFramework() {
        software.amazon.jsii.Kernel.call(this, "resetMlFramework", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessor() {
        software.amazon.jsii.Kernel.call(this, "resetProcessor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProgrammingLang() {
        software.amazon.jsii.Kernel.call(this, "resetProgrammingLang", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReleaseNotes() {
        software.amazon.jsii.Kernel.call(this, "resetReleaseNotes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVendorGuidance() {
        software.amazon.jsii.Kernel.call(this, "resetVendorGuidance", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getContainerImage() {
        return software.amazon.jsii.Kernel.get(this, "containerImage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageArn() {
        return software.amazon.jsii.Kernel.get(this, "imageArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBaseImageInput() {
        return software.amazon.jsii.Kernel.get(this, "baseImageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHorovodInput() {
        return software.amazon.jsii.Kernel.get(this, "horovodInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageNameInput() {
        return software.amazon.jsii.Kernel.get(this, "imageNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "jobTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMlFrameworkInput() {
        return software.amazon.jsii.Kernel.get(this, "mlFrameworkInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProcessorInput() {
        return software.amazon.jsii.Kernel.get(this, "processorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProgrammingLangInput() {
        return software.amazon.jsii.Kernel.get(this, "programmingLangInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReleaseNotesInput() {
        return software.amazon.jsii.Kernel.get(this, "releaseNotesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVendorGuidanceInput() {
        return software.amazon.jsii.Kernel.get(this, "vendorGuidanceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBaseImage() {
        return software.amazon.jsii.Kernel.get(this, "baseImage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBaseImage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "baseImage", java.util.Objects.requireNonNull(value, "baseImage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHorovod() {
        return software.amazon.jsii.Kernel.get(this, "horovod", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHorovod(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "horovod", java.util.Objects.requireNonNull(value, "horovod is required"));
    }

    public void setHorovod(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "horovod", java.util.Objects.requireNonNull(value, "horovod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageName() {
        return software.amazon.jsii.Kernel.get(this, "imageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageName", java.util.Objects.requireNonNull(value, "imageName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobType() {
        return software.amazon.jsii.Kernel.get(this, "jobType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobType", java.util.Objects.requireNonNull(value, "jobType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMlFramework() {
        return software.amazon.jsii.Kernel.get(this, "mlFramework", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMlFramework(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mlFramework", java.util.Objects.requireNonNull(value, "mlFramework is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProcessor() {
        return software.amazon.jsii.Kernel.get(this, "processor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProcessor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "processor", java.util.Objects.requireNonNull(value, "processor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProgrammingLang() {
        return software.amazon.jsii.Kernel.get(this, "programmingLang", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProgrammingLang(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "programmingLang", java.util.Objects.requireNonNull(value, "programmingLang is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReleaseNotes() {
        return software.amazon.jsii.Kernel.get(this, "releaseNotes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReleaseNotes(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "releaseNotes", java.util.Objects.requireNonNull(value, "releaseNotes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVendorGuidance() {
        return software.amazon.jsii.Kernel.get(this, "vendorGuidance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVendorGuidance(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vendorGuidance", java.util.Objects.requireNonNull(value, "vendorGuidance is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sagemaker_image_version.SagemakerImageVersion}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sagemaker_image_version.SagemakerImageVersion> {
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
        private final imports.aws.sagemaker_image_version.SagemakerImageVersionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sagemaker_image_version.SagemakerImageVersionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#base_image SagemakerImageVersion#base_image}.
         * <p>
         * @return {@code this}
         * @param baseImage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#base_image SagemakerImageVersion#base_image}. This parameter is required.
         */
        public Builder baseImage(final java.lang.String baseImage) {
            this.config.baseImage(baseImage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#image_name SagemakerImageVersion#image_name}.
         * <p>
         * @return {@code this}
         * @param imageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#image_name SagemakerImageVersion#image_name}. This parameter is required.
         */
        public Builder imageName(final java.lang.String imageName) {
            this.config.imageName(imageName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#horovod SagemakerImageVersion#horovod}.
         * <p>
         * @return {@code this}
         * @param horovod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#horovod SagemakerImageVersion#horovod}. This parameter is required.
         */
        public Builder horovod(final java.lang.Boolean horovod) {
            this.config.horovod(horovod);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#horovod SagemakerImageVersion#horovod}.
         * <p>
         * @return {@code this}
         * @param horovod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#horovod SagemakerImageVersion#horovod}. This parameter is required.
         */
        public Builder horovod(final com.hashicorp.cdktf.IResolvable horovod) {
            this.config.horovod(horovod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#id SagemakerImageVersion#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#id SagemakerImageVersion#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#job_type SagemakerImageVersion#job_type}.
         * <p>
         * @return {@code this}
         * @param jobType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#job_type SagemakerImageVersion#job_type}. This parameter is required.
         */
        public Builder jobType(final java.lang.String jobType) {
            this.config.jobType(jobType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#ml_framework SagemakerImageVersion#ml_framework}.
         * <p>
         * @return {@code this}
         * @param mlFramework Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#ml_framework SagemakerImageVersion#ml_framework}. This parameter is required.
         */
        public Builder mlFramework(final java.lang.String mlFramework) {
            this.config.mlFramework(mlFramework);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#processor SagemakerImageVersion#processor}.
         * <p>
         * @return {@code this}
         * @param processor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#processor SagemakerImageVersion#processor}. This parameter is required.
         */
        public Builder processor(final java.lang.String processor) {
            this.config.processor(processor);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#programming_lang SagemakerImageVersion#programming_lang}.
         * <p>
         * @return {@code this}
         * @param programmingLang Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#programming_lang SagemakerImageVersion#programming_lang}. This parameter is required.
         */
        public Builder programmingLang(final java.lang.String programmingLang) {
            this.config.programmingLang(programmingLang);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#release_notes SagemakerImageVersion#release_notes}.
         * <p>
         * @return {@code this}
         * @param releaseNotes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#release_notes SagemakerImageVersion#release_notes}. This parameter is required.
         */
        public Builder releaseNotes(final java.lang.String releaseNotes) {
            this.config.releaseNotes(releaseNotes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#vendor_guidance SagemakerImageVersion#vendor_guidance}.
         * <p>
         * @return {@code this}
         * @param vendorGuidance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#vendor_guidance SagemakerImageVersion#vendor_guidance}. This parameter is required.
         */
        public Builder vendorGuidance(final java.lang.String vendorGuidance) {
            this.config.vendorGuidance(vendorGuidance);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sagemaker_image_version.SagemakerImageVersion}.
         */
        @Override
        public imports.aws.sagemaker_image_version.SagemakerImageVersion build() {
            return new imports.aws.sagemaker_image_version.SagemakerImageVersion(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
