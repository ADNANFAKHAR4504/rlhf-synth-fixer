package imports.aws.data_aws_iam_principal_policy_simulation;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation aws_iam_principal_policy_simulation}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.673Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulation")
public class DataAwsIamPrincipalPolicySimulation extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsIamPrincipalPolicySimulation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIamPrincipalPolicySimulation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation aws_iam_principal_policy_simulation} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsIamPrincipalPolicySimulation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsIamPrincipalPolicySimulation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsIamPrincipalPolicySimulation to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsIamPrincipalPolicySimulation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsIamPrincipalPolicySimulation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsIamPrincipalPolicySimulation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsIamPrincipalPolicySimulation to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsIamPrincipalPolicySimulation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putContext(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationContext>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationContext> __cast_cd4240 = (java.util.List<imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationContext>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationContext __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putContext", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdditionalPoliciesJson() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalPoliciesJson", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCallerArn() {
        software.amazon.jsii.Kernel.call(this, "resetCallerArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContext() {
        software.amazon.jsii.Kernel.call(this, "resetContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPermissionsBoundaryPoliciesJson() {
        software.amazon.jsii.Kernel.call(this, "resetPermissionsBoundaryPoliciesJson", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceArns() {
        software.amazon.jsii.Kernel.call(this, "resetResourceArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceHandlingOption() {
        software.amazon.jsii.Kernel.call(this, "resetResourceHandlingOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceOwnerAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceOwnerAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourcePolicyJson() {
        software.amazon.jsii.Kernel.call(this, "resetResourcePolicyJson", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getAllAllowed() {
        return software.amazon.jsii.Kernel.get(this, "allAllowed", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationContextList getContext() {
        return software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationContextList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationResultsList getResults() {
        return software.amazon.jsii.Kernel.get(this, "results", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationResultsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getActionNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "actionNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdditionalPoliciesJsonInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "additionalPoliciesJsonInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCallerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "callerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContextInput() {
        return software.amazon.jsii.Kernel.get(this, "contextInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPermissionsBoundaryPoliciesJsonInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "permissionsBoundaryPoliciesJsonInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicySourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "policySourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourceArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceHandlingOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceHandlingOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceOwnerAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceOwnerAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourcePolicyJsonInput() {
        return software.amazon.jsii.Kernel.get(this, "resourcePolicyJsonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getActionNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "actionNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setActionNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "actionNames", java.util.Objects.requireNonNull(value, "actionNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdditionalPoliciesJson() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "additionalPoliciesJson", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdditionalPoliciesJson(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "additionalPoliciesJson", java.util.Objects.requireNonNull(value, "additionalPoliciesJson is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCallerArn() {
        return software.amazon.jsii.Kernel.get(this, "callerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCallerArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "callerArn", java.util.Objects.requireNonNull(value, "callerArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPermissionsBoundaryPoliciesJson() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "permissionsBoundaryPoliciesJson", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPermissionsBoundaryPoliciesJson(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "permissionsBoundaryPoliciesJson", java.util.Objects.requireNonNull(value, "permissionsBoundaryPoliciesJson is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicySourceArn() {
        return software.amazon.jsii.Kernel.get(this, "policySourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicySourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policySourceArn", java.util.Objects.requireNonNull(value, "policySourceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResourceArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "resourceArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResourceArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resourceArns", java.util.Objects.requireNonNull(value, "resourceArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceHandlingOption() {
        return software.amazon.jsii.Kernel.get(this, "resourceHandlingOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceHandlingOption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceHandlingOption", java.util.Objects.requireNonNull(value, "resourceHandlingOption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceOwnerAccountId() {
        return software.amazon.jsii.Kernel.get(this, "resourceOwnerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceOwnerAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceOwnerAccountId", java.util.Objects.requireNonNull(value, "resourceOwnerAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourcePolicyJson() {
        return software.amazon.jsii.Kernel.get(this, "resourcePolicyJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourcePolicyJson(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourcePolicyJson", java.util.Objects.requireNonNull(value, "resourcePolicyJson is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulation> {
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
        private final imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationConfig.Builder();
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
         * One or more names of actions, like "iam:CreateUser", that should be included in the simulation.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#action_names DataAwsIamPrincipalPolicySimulation#action_names}
         * <p>
         * @return {@code this}
         * @param actionNames One or more names of actions, like "iam:CreateUser", that should be included in the simulation. This parameter is required.
         */
        public Builder actionNames(final java.util.List<java.lang.String> actionNames) {
            this.config.actionNames(actionNames);
            return this;
        }

        /**
         * ARN of the principal (e.g. user, role) whose existing configured access policies will be used as the basis for the simulation. If you specify a role ARN here, you can also set caller_arn to simulate a particular user acting with the given role.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#policy_source_arn DataAwsIamPrincipalPolicySimulation#policy_source_arn}
         * <p>
         * @return {@code this}
         * @param policySourceArn ARN of the principal (e.g. user, role) whose existing configured access policies will be used as the basis for the simulation. If you specify a role ARN here, you can also set caller_arn to simulate a particular user acting with the given role. This parameter is required.
         */
        public Builder policySourceArn(final java.lang.String policySourceArn) {
            this.config.policySourceArn(policySourceArn);
            return this;
        }

        /**
         * Additional principal-based policies to use in the simulation.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#additional_policies_json DataAwsIamPrincipalPolicySimulation#additional_policies_json}
         * <p>
         * @return {@code this}
         * @param additionalPoliciesJson Additional principal-based policies to use in the simulation. This parameter is required.
         */
        public Builder additionalPoliciesJson(final java.util.List<java.lang.String> additionalPoliciesJson) {
            this.config.additionalPoliciesJson(additionalPoliciesJson);
            return this;
        }

        /**
         * ARN of a user to use as the caller of the simulated requests.
         * <p>
         * If not specified, defaults to the principal specified in policy_source_arn, if it is a user ARN.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#caller_arn DataAwsIamPrincipalPolicySimulation#caller_arn}
         * <p>
         * @return {@code this}
         * @param callerArn ARN of a user to use as the caller of the simulated requests. This parameter is required.
         */
        public Builder callerArn(final java.lang.String callerArn) {
            this.config.callerArn(callerArn);
            return this;
        }

        /**
         * context block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#context DataAwsIamPrincipalPolicySimulation#context}
         * <p>
         * @return {@code this}
         * @param context context block. This parameter is required.
         */
        public Builder context(final com.hashicorp.cdktf.IResolvable context) {
            this.config.context(context);
            return this;
        }
        /**
         * context block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#context DataAwsIamPrincipalPolicySimulation#context}
         * <p>
         * @return {@code this}
         * @param context context block. This parameter is required.
         */
        public Builder context(final java.util.List<? extends imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationContext> context) {
            this.config.context(context);
            return this;
        }

        /**
         * Additional permission boundary policies to use in the simulation.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#permissions_boundary_policies_json DataAwsIamPrincipalPolicySimulation#permissions_boundary_policies_json}
         * <p>
         * @return {@code this}
         * @param permissionsBoundaryPoliciesJson Additional permission boundary policies to use in the simulation. This parameter is required.
         */
        public Builder permissionsBoundaryPoliciesJson(final java.util.List<java.lang.String> permissionsBoundaryPoliciesJson) {
            this.config.permissionsBoundaryPoliciesJson(permissionsBoundaryPoliciesJson);
            return this;
        }

        /**
         * ARNs of specific resources to use as the targets of the specified actions during simulation.
         * <p>
         * If not specified, the simulator assumes "*" which represents general access across all resources.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_arns DataAwsIamPrincipalPolicySimulation#resource_arns}
         * <p>
         * @return {@code this}
         * @param resourceArns ARNs of specific resources to use as the targets of the specified actions during simulation. This parameter is required.
         */
        public Builder resourceArns(final java.util.List<java.lang.String> resourceArns) {
            this.config.resourceArns(resourceArns);
            return this;
        }

        /**
         * Specifies the type of simulation to run.
         * <p>
         * Some API operations need a particular resource handling option in order to produce a correct reesult.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_handling_option DataAwsIamPrincipalPolicySimulation#resource_handling_option}
         * <p>
         * @return {@code this}
         * @param resourceHandlingOption Specifies the type of simulation to run. This parameter is required.
         */
        public Builder resourceHandlingOption(final java.lang.String resourceHandlingOption) {
            this.config.resourceHandlingOption(resourceHandlingOption);
            return this;
        }

        /**
         * An AWS account ID to use as the simulated owner for any resource whose ARN does not include a specific owner account ID.
         * <p>
         * Defaults to the account given as part of caller_arn.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_owner_account_id DataAwsIamPrincipalPolicySimulation#resource_owner_account_id}
         * <p>
         * @return {@code this}
         * @param resourceOwnerAccountId An AWS account ID to use as the simulated owner for any resource whose ARN does not include a specific owner account ID. This parameter is required.
         */
        public Builder resourceOwnerAccountId(final java.lang.String resourceOwnerAccountId) {
            this.config.resourceOwnerAccountId(resourceOwnerAccountId);
            return this;
        }

        /**
         * A resource policy to associate with all of the target resources for simulation purposes.
         * <p>
         * The policy simulator does not automatically retrieve resource-level policies, so if a resource policy is crucial to your test then you must specify here the same policy document associated with your target resource(s).
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_policy_json DataAwsIamPrincipalPolicySimulation#resource_policy_json}
         * <p>
         * @return {@code this}
         * @param resourcePolicyJson A resource policy to associate with all of the target resources for simulation purposes. This parameter is required.
         */
        public Builder resourcePolicyJson(final java.lang.String resourcePolicyJson) {
            this.config.resourcePolicyJson(resourcePolicyJson);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulation}.
         */
        @Override
        public imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulation build() {
            return new imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
