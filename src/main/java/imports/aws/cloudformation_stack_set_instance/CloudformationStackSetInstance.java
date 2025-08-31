package imports.aws.cloudformation_stack_set_instance;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance aws_cloudformation_stack_set_instance}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackSetInstance.CloudformationStackSetInstance")
public class CloudformationStackSetInstance extends com.hashicorp.cdktf.TerraformResource {

    protected CloudformationStackSetInstance(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudformationStackSetInstance(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstance.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance aws_cloudformation_stack_set_instance} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudformationStackSetInstance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudformationStackSetInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudformationStackSetInstance to import. This parameter is required.
     * @param importFromId The id of the existing CloudformationStackSetInstance that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudformationStackSetInstance to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudformationStackSetInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudformationStackSetInstance to import. This parameter is required.
     * @param importFromId The id of the existing CloudformationStackSetInstance that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDeploymentTargets(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets value) {
        software.amazon.jsii.Kernel.call(this, "putDeploymentTargets", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOperationPreferences(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences value) {
        software.amazon.jsii.Kernel.call(this, "putOperationPreferences", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAccountId", software.amazon.jsii.NativeType.VOID);
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

    public void resetRegion() {
        software.amazon.jsii.Kernel.call(this, "resetRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetainStack() {
        software.amazon.jsii.Kernel.call(this, "resetRetainStack", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargetsOutputReference getDeploymentTargets() {
        return software.amazon.jsii.Kernel.get(this, "deploymentTargets", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargetsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferencesOutputReference getOperationPreferences() {
        return software.amazon.jsii.Kernel.get(this, "operationPreferences", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferencesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganizationalUnitId() {
        return software.amazon.jsii.Kernel.get(this, "organizationalUnitId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackId() {
        return software.amazon.jsii.Kernel.get(this, "stackId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceStackInstanceSummariesList getStackInstanceSummaries() {
        return software.amazon.jsii.Kernel.get(this, "stackInstanceSummaries", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceStackInstanceSummariesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCallAsInput() {
        return software.amazon.jsii.Kernel.get(this, "callAsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets getDeploymentTargetsInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentTargetsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences getOperationPreferencesInput() {
        return software.amazon.jsii.Kernel.get(this, "operationPreferencesInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameterOverridesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parameterOverridesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "regionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRetainStackInput() {
        return software.amazon.jsii.Kernel.get(this, "retainStackInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStackSetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "stackSetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getRegion() {
        return software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "region", java.util.Objects.requireNonNull(value, "region is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRetainStack() {
        return software.amazon.jsii.Kernel.get(this, "retainStack", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRetainStack(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "retainStack", java.util.Objects.requireNonNull(value, "retainStack is required"));
    }

    public void setRetainStack(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "retainStack", java.util.Objects.requireNonNull(value, "retainStack is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackSetName() {
        return software.amazon.jsii.Kernel.get(this, "stackSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStackSetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stackSetName", java.util.Objects.requireNonNull(value, "stackSetName is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstance}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstance> {
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
        private final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#stack_set_name CloudformationStackSetInstance#stack_set_name}.
         * <p>
         * @return {@code this}
         * @param stackSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#stack_set_name CloudformationStackSetInstance#stack_set_name}. This parameter is required.
         */
        public Builder stackSetName(final java.lang.String stackSetName) {
            this.config.stackSetName(stackSetName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#account_id CloudformationStackSetInstance#account_id}.
         * <p>
         * @return {@code this}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#account_id CloudformationStackSetInstance#account_id}. This parameter is required.
         */
        public Builder accountId(final java.lang.String accountId) {
            this.config.accountId(accountId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#call_as CloudformationStackSetInstance#call_as}.
         * <p>
         * @return {@code this}
         * @param callAs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#call_as CloudformationStackSetInstance#call_as}. This parameter is required.
         */
        public Builder callAs(final java.lang.String callAs) {
            this.config.callAs(callAs);
            return this;
        }

        /**
         * deployment_targets block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#deployment_targets CloudformationStackSetInstance#deployment_targets}
         * <p>
         * @return {@code this}
         * @param deploymentTargets deployment_targets block. This parameter is required.
         */
        public Builder deploymentTargets(final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets deploymentTargets) {
            this.config.deploymentTargets(deploymentTargets);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#id CloudformationStackSetInstance#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#id CloudformationStackSetInstance#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * operation_preferences block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#operation_preferences CloudformationStackSetInstance#operation_preferences}
         * <p>
         * @return {@code this}
         * @param operationPreferences operation_preferences block. This parameter is required.
         */
        public Builder operationPreferences(final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences operationPreferences) {
            this.config.operationPreferences(operationPreferences);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#parameter_overrides CloudformationStackSetInstance#parameter_overrides}.
         * <p>
         * @return {@code this}
         * @param parameterOverrides Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#parameter_overrides CloudformationStackSetInstance#parameter_overrides}. This parameter is required.
         */
        public Builder parameterOverrides(final java.util.Map<java.lang.String, java.lang.String> parameterOverrides) {
            this.config.parameterOverrides(parameterOverrides);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#region CloudformationStackSetInstance#region}.
         * <p>
         * @return {@code this}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#region CloudformationStackSetInstance#region}. This parameter is required.
         */
        public Builder region(final java.lang.String region) {
            this.config.region(region);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#retain_stack CloudformationStackSetInstance#retain_stack}.
         * <p>
         * @return {@code this}
         * @param retainStack Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#retain_stack CloudformationStackSetInstance#retain_stack}. This parameter is required.
         */
        public Builder retainStack(final java.lang.Boolean retainStack) {
            this.config.retainStack(retainStack);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#retain_stack CloudformationStackSetInstance#retain_stack}.
         * <p>
         * @return {@code this}
         * @param retainStack Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#retain_stack CloudformationStackSetInstance#retain_stack}. This parameter is required.
         */
        public Builder retainStack(final com.hashicorp.cdktf.IResolvable retainStack) {
            this.config.retainStack(retainStack);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#timeouts CloudformationStackSetInstance#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstance}.
         */
        @Override
        public imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstance build() {
            return new imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstance(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
