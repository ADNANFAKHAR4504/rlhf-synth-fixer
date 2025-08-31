package imports.aws.cloudformation_stack_instances;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances aws_cloudformation_stack_instances}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.219Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackInstances.CloudformationStackInstances")
public class CloudformationStackInstances extends com.hashicorp.cdktf.TerraformResource {

    protected CloudformationStackInstances(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudformationStackInstances(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudformation_stack_instances.CloudformationStackInstances.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances aws_cloudformation_stack_instances} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudformationStackInstances(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_instances.CloudformationStackInstancesConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudformationStackInstances resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudformationStackInstances to import. This parameter is required.
     * @param importFromId The id of the existing CloudformationStackInstances that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudformationStackInstances to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudformation_stack_instances.CloudformationStackInstances.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudformationStackInstances resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudformationStackInstances to import. This parameter is required.
     * @param importFromId The id of the existing CloudformationStackInstances that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudformation_stack_instances.CloudformationStackInstances.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDeploymentTargets(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargets value) {
        software.amazon.jsii.Kernel.call(this, "putDeploymentTargets", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOperationPreferences(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferences value) {
        software.amazon.jsii.Kernel.call(this, "putOperationPreferences", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_instances.CloudformationStackInstancesTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCallAs() {
        software.amazon.jsii.Kernel.call(this, "resetCallAs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeploymentTargets() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentTargets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOperationPreferences() {
        software.amazon.jsii.Kernel.call(this, "resetOperationPreferences", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameterOverrides() {
        software.amazon.jsii.Kernel.call(this, "resetParameterOverrides", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegions() {
        software.amazon.jsii.Kernel.call(this, "resetRegions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetainStacks() {
        software.amazon.jsii.Kernel.call(this, "resetRetainStacks", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargetsOutputReference getDeploymentTargets() {
        return software.amazon.jsii.Kernel.get(this, "deploymentTargets", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargetsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferencesOutputReference getOperationPreferences() {
        return software.amazon.jsii.Kernel.get(this, "operationPreferences", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferencesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_instances.CloudformationStackInstancesStackInstanceSummariesList getStackInstanceSummaries() {
        return software.amazon.jsii.Kernel.get(this, "stackInstanceSummaries", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_instances.CloudformationStackInstancesStackInstanceSummariesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackSetId() {
        return software.amazon.jsii.Kernel.get(this, "stackSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_instances.CloudformationStackInstancesTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_instances.CloudformationStackInstancesTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "accountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCallAsInput() {
        return software.amazon.jsii.Kernel.get(this, "callAsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargets getDeploymentTargetsInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentTargetsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargets.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferences getOperationPreferencesInput() {
        return software.amazon.jsii.Kernel.get(this, "operationPreferencesInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferences.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameterOverridesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parameterOverridesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRetainStacksInput() {
        return software.amazon.jsii.Kernel.get(this, "retainStacksInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStackSetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "stackSetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "accounts", java.util.Objects.requireNonNull(value, "accounts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCallAs() {
        return software.amazon.jsii.Kernel.get(this, "callAs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCallAs(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "callAs", java.util.Objects.requireNonNull(value, "callAs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameterOverrides() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameterOverrides", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameterOverrides(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameterOverrides", java.util.Objects.requireNonNull(value, "parameterOverrides is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regions", java.util.Objects.requireNonNull(value, "regions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRetainStacks() {
        return software.amazon.jsii.Kernel.get(this, "retainStacks", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRetainStacks(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "retainStacks", java.util.Objects.requireNonNull(value, "retainStacks is required"));
    }

    public void setRetainStacks(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "retainStacks", java.util.Objects.requireNonNull(value, "retainStacks is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackSetName() {
        return software.amazon.jsii.Kernel.get(this, "stackSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStackSetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stackSetName", java.util.Objects.requireNonNull(value, "stackSetName is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudformation_stack_instances.CloudformationStackInstances}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudformation_stack_instances.CloudformationStackInstances> {
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
        private final imports.aws.cloudformation_stack_instances.CloudformationStackInstancesConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudformation_stack_instances.CloudformationStackInstancesConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#stack_set_name CloudformationStackInstances#stack_set_name}.
         * <p>
         * @return {@code this}
         * @param stackSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#stack_set_name CloudformationStackInstances#stack_set_name}. This parameter is required.
         */
        public Builder stackSetName(final java.lang.String stackSetName) {
            this.config.stackSetName(stackSetName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.
         * <p>
         * @return {@code this}
         * @param accounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}. This parameter is required.
         */
        public Builder accounts(final java.util.List<java.lang.String> accounts) {
            this.config.accounts(accounts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#call_as CloudformationStackInstances#call_as}.
         * <p>
         * @return {@code this}
         * @param callAs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#call_as CloudformationStackInstances#call_as}. This parameter is required.
         */
        public Builder callAs(final java.lang.String callAs) {
            this.config.callAs(callAs);
            return this;
        }

        /**
         * deployment_targets block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#deployment_targets CloudformationStackInstances#deployment_targets}
         * <p>
         * @return {@code this}
         * @param deploymentTargets deployment_targets block. This parameter is required.
         */
        public Builder deploymentTargets(final imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargets deploymentTargets) {
            this.config.deploymentTargets(deploymentTargets);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#id CloudformationStackInstances#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#id CloudformationStackInstances#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * operation_preferences block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#operation_preferences CloudformationStackInstances#operation_preferences}
         * <p>
         * @return {@code this}
         * @param operationPreferences operation_preferences block. This parameter is required.
         */
        public Builder operationPreferences(final imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferences operationPreferences) {
            this.config.operationPreferences(operationPreferences);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#parameter_overrides CloudformationStackInstances#parameter_overrides}.
         * <p>
         * @return {@code this}
         * @param parameterOverrides Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#parameter_overrides CloudformationStackInstances#parameter_overrides}. This parameter is required.
         */
        public Builder parameterOverrides(final java.util.Map<java.lang.String, java.lang.String> parameterOverrides) {
            this.config.parameterOverrides(parameterOverrides);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#regions CloudformationStackInstances#regions}.
         * <p>
         * @return {@code this}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#regions CloudformationStackInstances#regions}. This parameter is required.
         */
        public Builder regions(final java.util.List<java.lang.String> regions) {
            this.config.regions(regions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#retain_stacks CloudformationStackInstances#retain_stacks}.
         * <p>
         * @return {@code this}
         * @param retainStacks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#retain_stacks CloudformationStackInstances#retain_stacks}. This parameter is required.
         */
        public Builder retainStacks(final java.lang.Boolean retainStacks) {
            this.config.retainStacks(retainStacks);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#retain_stacks CloudformationStackInstances#retain_stacks}.
         * <p>
         * @return {@code this}
         * @param retainStacks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#retain_stacks CloudformationStackInstances#retain_stacks}. This parameter is required.
         */
        public Builder retainStacks(final com.hashicorp.cdktf.IResolvable retainStacks) {
            this.config.retainStacks(retainStacks);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#timeouts CloudformationStackInstances#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.cloudformation_stack_instances.CloudformationStackInstancesTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudformation_stack_instances.CloudformationStackInstances}.
         */
        @Override
        public imports.aws.cloudformation_stack_instances.CloudformationStackInstances build() {
            return new imports.aws.cloudformation_stack_instances.CloudformationStackInstances(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
