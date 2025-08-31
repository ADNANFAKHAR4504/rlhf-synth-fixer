package imports.aws.lambda_invocation;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation aws_lambda_invocation}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.506Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaInvocation.LambdaInvocation")
public class LambdaInvocation extends com.hashicorp.cdktf.TerraformResource {

    protected LambdaInvocation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaInvocation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lambda_invocation.LambdaInvocation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation aws_lambda_invocation} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LambdaInvocation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lambda_invocation.LambdaInvocationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LambdaInvocation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaInvocation to import. This parameter is required.
     * @param importFromId The id of the existing LambdaInvocation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LambdaInvocation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_invocation.LambdaInvocation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LambdaInvocation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaInvocation to import. This parameter is required.
     * @param importFromId The id of the existing LambdaInvocation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_invocation.LambdaInvocation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLifecycleScope() {
        software.amazon.jsii.Kernel.call(this, "resetLifecycleScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQualifier() {
        software.amazon.jsii.Kernel.call(this, "resetQualifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerraformKey() {
        software.amazon.jsii.Kernel.call(this, "resetTerraformKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTriggers() {
        software.amazon.jsii.Kernel.call(this, "resetTriggers", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getResult() {
        return software.amazon.jsii.Kernel.get(this, "result", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "functionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputInput() {
        return software.amazon.jsii.Kernel.get(this, "inputInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLifecycleScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleScopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQualifierInput() {
        return software.amazon.jsii.Kernel.get(this, "qualifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTerraformKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "terraformKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTriggersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "triggersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionName() {
        return software.amazon.jsii.Kernel.get(this, "functionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunctionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "functionName", java.util.Objects.requireNonNull(value, "functionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInput() {
        return software.amazon.jsii.Kernel.get(this, "input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInput(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "input", java.util.Objects.requireNonNull(value, "input is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLifecycleScope() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLifecycleScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lifecycleScope", java.util.Objects.requireNonNull(value, "lifecycleScope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQualifier() {
        return software.amazon.jsii.Kernel.get(this, "qualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQualifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "qualifier", java.util.Objects.requireNonNull(value, "qualifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTerraformKey() {
        return software.amazon.jsii.Kernel.get(this, "terraformKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTerraformKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "terraformKey", java.util.Objects.requireNonNull(value, "terraformKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTriggers() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "triggers", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTriggers(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "triggers", java.util.Objects.requireNonNull(value, "triggers is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lambda_invocation.LambdaInvocation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lambda_invocation.LambdaInvocation> {
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
        private final imports.aws.lambda_invocation.LambdaInvocationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lambda_invocation.LambdaInvocationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#function_name LambdaInvocation#function_name}.
         * <p>
         * @return {@code this}
         * @param functionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#function_name LambdaInvocation#function_name}. This parameter is required.
         */
        public Builder functionName(final java.lang.String functionName) {
            this.config.functionName(functionName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#input LambdaInvocation#input}.
         * <p>
         * @return {@code this}
         * @param input Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#input LambdaInvocation#input}. This parameter is required.
         */
        public Builder input(final java.lang.String input) {
            this.config.input(input);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#id LambdaInvocation#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#id LambdaInvocation#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#lifecycle_scope LambdaInvocation#lifecycle_scope}.
         * <p>
         * @return {@code this}
         * @param lifecycleScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#lifecycle_scope LambdaInvocation#lifecycle_scope}. This parameter is required.
         */
        public Builder lifecycleScope(final java.lang.String lifecycleScope) {
            this.config.lifecycleScope(lifecycleScope);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#qualifier LambdaInvocation#qualifier}.
         * <p>
         * @return {@code this}
         * @param qualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#qualifier LambdaInvocation#qualifier}. This parameter is required.
         */
        public Builder qualifier(final java.lang.String qualifier) {
            this.config.qualifier(qualifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#terraform_key LambdaInvocation#terraform_key}.
         * <p>
         * @return {@code this}
         * @param terraformKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#terraform_key LambdaInvocation#terraform_key}. This parameter is required.
         */
        public Builder terraformKey(final java.lang.String terraformKey) {
            this.config.terraformKey(terraformKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#triggers LambdaInvocation#triggers}.
         * <p>
         * @return {@code this}
         * @param triggers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_invocation#triggers LambdaInvocation#triggers}. This parameter is required.
         */
        public Builder triggers(final java.util.Map<java.lang.String, java.lang.String> triggers) {
            this.config.triggers(triggers);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lambda_invocation.LambdaInvocation}.
         */
        @Override
        public imports.aws.lambda_invocation.LambdaInvocation build() {
            return new imports.aws.lambda_invocation.LambdaInvocation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
