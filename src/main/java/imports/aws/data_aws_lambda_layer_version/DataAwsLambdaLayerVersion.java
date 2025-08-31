package imports.aws.data_aws_lambda_layer_version;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version aws_lambda_layer_version}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.724Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLambdaLayerVersion.DataAwsLambdaLayerVersion")
public class DataAwsLambdaLayerVersion extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsLambdaLayerVersion(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsLambdaLayerVersion(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersion.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version aws_lambda_layer_version} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsLambdaLayerVersion(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsLambdaLayerVersion resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsLambdaLayerVersion to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsLambdaLayerVersion that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsLambdaLayerVersion to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersion.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsLambdaLayerVersion resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsLambdaLayerVersion to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsLambdaLayerVersion that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersion.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetCompatibleArchitecture() {
        software.amazon.jsii.Kernel.call(this, "resetCompatibleArchitecture", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCompatibleRuntime() {
        software.amazon.jsii.Kernel.call(this, "resetCompatibleRuntime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCodeSha256() {
        return software.amazon.jsii.Kernel.get(this, "codeSha256", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCompatibleArchitectures() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "compatibleArchitectures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCompatibleRuntimes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "compatibleRuntimes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedDate() {
        return software.amazon.jsii.Kernel.get(this, "createdDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLayerArn() {
        return software.amazon.jsii.Kernel.get(this, "layerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLicenseInfo() {
        return software.amazon.jsii.Kernel.get(this, "licenseInfo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningJobArn() {
        return software.amazon.jsii.Kernel.get(this, "signingJobArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningProfileVersionArn() {
        return software.amazon.jsii.Kernel.get(this, "signingProfileVersionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceCodeHash() {
        return software.amazon.jsii.Kernel.get(this, "sourceCodeHash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSourceCodeSize() {
        return software.amazon.jsii.Kernel.get(this, "sourceCodeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompatibleArchitectureInput() {
        return software.amazon.jsii.Kernel.get(this, "compatibleArchitectureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompatibleRuntimeInput() {
        return software.amazon.jsii.Kernel.get(this, "compatibleRuntimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLayerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "layerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompatibleArchitecture() {
        return software.amazon.jsii.Kernel.get(this, "compatibleArchitecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompatibleArchitecture(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "compatibleArchitecture", java.util.Objects.requireNonNull(value, "compatibleArchitecture is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompatibleRuntime() {
        return software.amazon.jsii.Kernel.get(this, "compatibleRuntime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompatibleRuntime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "compatibleRuntime", java.util.Objects.requireNonNull(value, "compatibleRuntime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLayerName() {
        return software.amazon.jsii.Kernel.get(this, "layerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLayerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "layerName", java.util.Objects.requireNonNull(value, "layerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVersion(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "version", java.util.Objects.requireNonNull(value, "version is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersion}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersion> {
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
        private final imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#layer_name DataAwsLambdaLayerVersion#layer_name}.
         * <p>
         * @return {@code this}
         * @param layerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#layer_name DataAwsLambdaLayerVersion#layer_name}. This parameter is required.
         */
        public Builder layerName(final java.lang.String layerName) {
            this.config.layerName(layerName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#compatible_architecture DataAwsLambdaLayerVersion#compatible_architecture}.
         * <p>
         * @return {@code this}
         * @param compatibleArchitecture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#compatible_architecture DataAwsLambdaLayerVersion#compatible_architecture}. This parameter is required.
         */
        public Builder compatibleArchitecture(final java.lang.String compatibleArchitecture) {
            this.config.compatibleArchitecture(compatibleArchitecture);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#compatible_runtime DataAwsLambdaLayerVersion#compatible_runtime}.
         * <p>
         * @return {@code this}
         * @param compatibleRuntime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#compatible_runtime DataAwsLambdaLayerVersion#compatible_runtime}. This parameter is required.
         */
        public Builder compatibleRuntime(final java.lang.String compatibleRuntime) {
            this.config.compatibleRuntime(compatibleRuntime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#id DataAwsLambdaLayerVersion#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#id DataAwsLambdaLayerVersion#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#version DataAwsLambdaLayerVersion#version}.
         * <p>
         * @return {@code this}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lambda_layer_version#version DataAwsLambdaLayerVersion#version}. This parameter is required.
         */
        public Builder version(final java.lang.Number version) {
            this.config.version(version);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersion}.
         */
        @Override
        public imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersion build() {
            return new imports.aws.data_aws_lambda_layer_version.DataAwsLambdaLayerVersion(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
