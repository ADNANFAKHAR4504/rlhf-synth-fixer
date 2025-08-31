package imports.aws.lambda_runtime_management_config;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config aws_lambda_runtime_management_config}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.512Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaRuntimeManagementConfig.LambdaRuntimeManagementConfig")
public class LambdaRuntimeManagementConfig extends com.hashicorp.cdktf.TerraformResource {

    protected LambdaRuntimeManagementConfig(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaRuntimeManagementConfig(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfig.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config aws_lambda_runtime_management_config} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LambdaRuntimeManagementConfig(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfigConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LambdaRuntimeManagementConfig resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaRuntimeManagementConfig to import. This parameter is required.
     * @param importFromId The id of the existing LambdaRuntimeManagementConfig that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LambdaRuntimeManagementConfig to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfig.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LambdaRuntimeManagementConfig resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaRuntimeManagementConfig to import. This parameter is required.
     * @param importFromId The id of the existing LambdaRuntimeManagementConfig that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfig.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetQualifier() {
        software.amazon.jsii.Kernel.call(this, "resetQualifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuntimeVersionArn() {
        software.amazon.jsii.Kernel.call(this, "resetRuntimeVersionArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdateRuntimeOn() {
        software.amazon.jsii.Kernel.call(this, "resetUpdateRuntimeOn", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionArn() {
        return software.amazon.jsii.Kernel.get(this, "functionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "functionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQualifierInput() {
        return software.amazon.jsii.Kernel.get(this, "qualifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuntimeVersionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimeVersionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUpdateRuntimeOnInput() {
        return software.amazon.jsii.Kernel.get(this, "updateRuntimeOnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionName() {
        return software.amazon.jsii.Kernel.get(this, "functionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunctionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "functionName", java.util.Objects.requireNonNull(value, "functionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQualifier() {
        return software.amazon.jsii.Kernel.get(this, "qualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQualifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "qualifier", java.util.Objects.requireNonNull(value, "qualifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuntimeVersionArn() {
        return software.amazon.jsii.Kernel.get(this, "runtimeVersionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuntimeVersionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "runtimeVersionArn", java.util.Objects.requireNonNull(value, "runtimeVersionArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUpdateRuntimeOn() {
        return software.amazon.jsii.Kernel.get(this, "updateRuntimeOn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUpdateRuntimeOn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "updateRuntimeOn", java.util.Objects.requireNonNull(value, "updateRuntimeOn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfig}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfig> {
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
        private final imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfigConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfigConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config#function_name LambdaRuntimeManagementConfig#function_name}.
         * <p>
         * @return {@code this}
         * @param functionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config#function_name LambdaRuntimeManagementConfig#function_name}. This parameter is required.
         */
        public Builder functionName(final java.lang.String functionName) {
            this.config.functionName(functionName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config#qualifier LambdaRuntimeManagementConfig#qualifier}.
         * <p>
         * @return {@code this}
         * @param qualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config#qualifier LambdaRuntimeManagementConfig#qualifier}. This parameter is required.
         */
        public Builder qualifier(final java.lang.String qualifier) {
            this.config.qualifier(qualifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config#runtime_version_arn LambdaRuntimeManagementConfig#runtime_version_arn}.
         * <p>
         * @return {@code this}
         * @param runtimeVersionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config#runtime_version_arn LambdaRuntimeManagementConfig#runtime_version_arn}. This parameter is required.
         */
        public Builder runtimeVersionArn(final java.lang.String runtimeVersionArn) {
            this.config.runtimeVersionArn(runtimeVersionArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config#update_runtime_on LambdaRuntimeManagementConfig#update_runtime_on}.
         * <p>
         * @return {@code this}
         * @param updateRuntimeOn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_runtime_management_config#update_runtime_on LambdaRuntimeManagementConfig#update_runtime_on}. This parameter is required.
         */
        public Builder updateRuntimeOn(final java.lang.String updateRuntimeOn) {
            this.config.updateRuntimeOn(updateRuntimeOn);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfig}.
         */
        @Override
        public imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfig build() {
            return new imports.aws.lambda_runtime_management_config.LambdaRuntimeManagementConfig(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
