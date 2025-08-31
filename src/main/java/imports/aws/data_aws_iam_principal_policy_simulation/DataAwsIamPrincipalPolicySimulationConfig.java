package imports.aws.data_aws_iam_principal_policy_simulation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.674Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsIamPrincipalPolicySimulationConfig.Jsii$Proxy.class)
public interface DataAwsIamPrincipalPolicySimulationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * One or more names of actions, like "iam:CreateUser", that should be included in the simulation.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#action_names DataAwsIamPrincipalPolicySimulation#action_names}
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getActionNames();

    /**
     * ARN of the principal (e.g. user, role) whose existing configured access policies will be used as the basis for the simulation. If you specify a role ARN here, you can also set caller_arn to simulate a particular user acting with the given role.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#policy_source_arn DataAwsIamPrincipalPolicySimulation#policy_source_arn}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicySourceArn();

    /**
     * Additional principal-based policies to use in the simulation.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#additional_policies_json DataAwsIamPrincipalPolicySimulation#additional_policies_json}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdditionalPoliciesJson() {
        return null;
    }

    /**
     * ARN of a user to use as the caller of the simulated requests.
     * <p>
     * If not specified, defaults to the principal specified in policy_source_arn, if it is a user ARN.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#caller_arn DataAwsIamPrincipalPolicySimulation#caller_arn}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCallerArn() {
        return null;
    }

    /**
     * context block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#context DataAwsIamPrincipalPolicySimulation#context}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContext() {
        return null;
    }

    /**
     * Additional permission boundary policies to use in the simulation.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#permissions_boundary_policies_json DataAwsIamPrincipalPolicySimulation#permissions_boundary_policies_json}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPermissionsBoundaryPoliciesJson() {
        return null;
    }

    /**
     * ARNs of specific resources to use as the targets of the specified actions during simulation.
     * <p>
     * If not specified, the simulator assumes "*" which represents general access across all resources.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_arns DataAwsIamPrincipalPolicySimulation#resource_arns}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceArns() {
        return null;
    }

    /**
     * Specifies the type of simulation to run.
     * <p>
     * Some API operations need a particular resource handling option in order to produce a correct reesult.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_handling_option DataAwsIamPrincipalPolicySimulation#resource_handling_option}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceHandlingOption() {
        return null;
    }

    /**
     * An AWS account ID to use as the simulated owner for any resource whose ARN does not include a specific owner account ID.
     * <p>
     * Defaults to the account given as part of caller_arn.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_owner_account_id DataAwsIamPrincipalPolicySimulation#resource_owner_account_id}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceOwnerAccountId() {
        return null;
    }

    /**
     * A resource policy to associate with all of the target resources for simulation purposes.
     * <p>
     * The policy simulator does not automatically retrieve resource-level policies, so if a resource policy is crucial to your test then you must specify here the same policy document associated with your target resource(s).
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_policy_json DataAwsIamPrincipalPolicySimulation#resource_policy_json}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourcePolicyJson() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsIamPrincipalPolicySimulationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIamPrincipalPolicySimulationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIamPrincipalPolicySimulationConfig> {
        java.util.List<java.lang.String> actionNames;
        java.lang.String policySourceArn;
        java.util.List<java.lang.String> additionalPoliciesJson;
        java.lang.String callerArn;
        java.lang.Object context;
        java.util.List<java.lang.String> permissionsBoundaryPoliciesJson;
        java.util.List<java.lang.String> resourceArns;
        java.lang.String resourceHandlingOption;
        java.lang.String resourceOwnerAccountId;
        java.lang.String resourcePolicyJson;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getActionNames}
         * @param actionNames One or more names of actions, like "iam:CreateUser", that should be included in the simulation. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#action_names DataAwsIamPrincipalPolicySimulation#action_names}
         * @return {@code this}
         */
        public Builder actionNames(java.util.List<java.lang.String> actionNames) {
            this.actionNames = actionNames;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getPolicySourceArn}
         * @param policySourceArn ARN of the principal (e.g. user, role) whose existing configured access policies will be used as the basis for the simulation. If you specify a role ARN here, you can also set caller_arn to simulate a particular user acting with the given role. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#policy_source_arn DataAwsIamPrincipalPolicySimulation#policy_source_arn}
         * @return {@code this}
         */
        public Builder policySourceArn(java.lang.String policySourceArn) {
            this.policySourceArn = policySourceArn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getAdditionalPoliciesJson}
         * @param additionalPoliciesJson Additional principal-based policies to use in the simulation.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#additional_policies_json DataAwsIamPrincipalPolicySimulation#additional_policies_json}
         * @return {@code this}
         */
        public Builder additionalPoliciesJson(java.util.List<java.lang.String> additionalPoliciesJson) {
            this.additionalPoliciesJson = additionalPoliciesJson;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getCallerArn}
         * @param callerArn ARN of a user to use as the caller of the simulated requests.
         *                  If not specified, defaults to the principal specified in policy_source_arn, if it is a user ARN.
         *                  
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#caller_arn DataAwsIamPrincipalPolicySimulation#caller_arn}
         * @return {@code this}
         */
        public Builder callerArn(java.lang.String callerArn) {
            this.callerArn = callerArn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getContext}
         * @param context context block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#context DataAwsIamPrincipalPolicySimulation#context}
         * @return {@code this}
         */
        public Builder context(com.hashicorp.cdktf.IResolvable context) {
            this.context = context;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getContext}
         * @param context context block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#context DataAwsIamPrincipalPolicySimulation#context}
         * @return {@code this}
         */
        public Builder context(java.util.List<? extends imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationContext> context) {
            this.context = context;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getPermissionsBoundaryPoliciesJson}
         * @param permissionsBoundaryPoliciesJson Additional permission boundary policies to use in the simulation.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#permissions_boundary_policies_json DataAwsIamPrincipalPolicySimulation#permissions_boundary_policies_json}
         * @return {@code this}
         */
        public Builder permissionsBoundaryPoliciesJson(java.util.List<java.lang.String> permissionsBoundaryPoliciesJson) {
            this.permissionsBoundaryPoliciesJson = permissionsBoundaryPoliciesJson;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getResourceArns}
         * @param resourceArns ARNs of specific resources to use as the targets of the specified actions during simulation.
         *                     If not specified, the simulator assumes "*" which represents general access across all resources.
         *                     
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_arns DataAwsIamPrincipalPolicySimulation#resource_arns}
         * @return {@code this}
         */
        public Builder resourceArns(java.util.List<java.lang.String> resourceArns) {
            this.resourceArns = resourceArns;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getResourceHandlingOption}
         * @param resourceHandlingOption Specifies the type of simulation to run.
         *                               Some API operations need a particular resource handling option in order to produce a correct reesult.
         *                               
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_handling_option DataAwsIamPrincipalPolicySimulation#resource_handling_option}
         * @return {@code this}
         */
        public Builder resourceHandlingOption(java.lang.String resourceHandlingOption) {
            this.resourceHandlingOption = resourceHandlingOption;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getResourceOwnerAccountId}
         * @param resourceOwnerAccountId An AWS account ID to use as the simulated owner for any resource whose ARN does not include a specific owner account ID.
         *                               Defaults to the account given as part of caller_arn.
         *                               
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_owner_account_id DataAwsIamPrincipalPolicySimulation#resource_owner_account_id}
         * @return {@code this}
         */
        public Builder resourceOwnerAccountId(java.lang.String resourceOwnerAccountId) {
            this.resourceOwnerAccountId = resourceOwnerAccountId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getResourcePolicyJson}
         * @param resourcePolicyJson A resource policy to associate with all of the target resources for simulation purposes.
         *                           The policy simulator does not automatically retrieve resource-level policies, so if a resource policy is crucial to your test then you must specify here the same policy document associated with your target resource(s).
         *                           
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#resource_policy_json DataAwsIamPrincipalPolicySimulation#resource_policy_json}
         * @return {@code this}
         */
        public Builder resourcePolicyJson(java.lang.String resourcePolicyJson) {
            this.resourcePolicyJson = resourcePolicyJson;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsIamPrincipalPolicySimulationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIamPrincipalPolicySimulationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIamPrincipalPolicySimulationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIamPrincipalPolicySimulationConfig {
        private final java.util.List<java.lang.String> actionNames;
        private final java.lang.String policySourceArn;
        private final java.util.List<java.lang.String> additionalPoliciesJson;
        private final java.lang.String callerArn;
        private final java.lang.Object context;
        private final java.util.List<java.lang.String> permissionsBoundaryPoliciesJson;
        private final java.util.List<java.lang.String> resourceArns;
        private final java.lang.String resourceHandlingOption;
        private final java.lang.String resourceOwnerAccountId;
        private final java.lang.String resourcePolicyJson;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actionNames = software.amazon.jsii.Kernel.get(this, "actionNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.policySourceArn = software.amazon.jsii.Kernel.get(this, "policySourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalPoliciesJson = software.amazon.jsii.Kernel.get(this, "additionalPoliciesJson", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.callerArn = software.amazon.jsii.Kernel.get(this, "callerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.context = software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.permissionsBoundaryPoliciesJson = software.amazon.jsii.Kernel.get(this, "permissionsBoundaryPoliciesJson", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceArns = software.amazon.jsii.Kernel.get(this, "resourceArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceHandlingOption = software.amazon.jsii.Kernel.get(this, "resourceHandlingOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceOwnerAccountId = software.amazon.jsii.Kernel.get(this, "resourceOwnerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourcePolicyJson = software.amazon.jsii.Kernel.get(this, "resourcePolicyJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actionNames = java.util.Objects.requireNonNull(builder.actionNames, "actionNames is required");
            this.policySourceArn = java.util.Objects.requireNonNull(builder.policySourceArn, "policySourceArn is required");
            this.additionalPoliciesJson = builder.additionalPoliciesJson;
            this.callerArn = builder.callerArn;
            this.context = builder.context;
            this.permissionsBoundaryPoliciesJson = builder.permissionsBoundaryPoliciesJson;
            this.resourceArns = builder.resourceArns;
            this.resourceHandlingOption = builder.resourceHandlingOption;
            this.resourceOwnerAccountId = builder.resourceOwnerAccountId;
            this.resourcePolicyJson = builder.resourcePolicyJson;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getActionNames() {
            return this.actionNames;
        }

        @Override
        public final java.lang.String getPolicySourceArn() {
            return this.policySourceArn;
        }

        @Override
        public final java.util.List<java.lang.String> getAdditionalPoliciesJson() {
            return this.additionalPoliciesJson;
        }

        @Override
        public final java.lang.String getCallerArn() {
            return this.callerArn;
        }

        @Override
        public final java.lang.Object getContext() {
            return this.context;
        }

        @Override
        public final java.util.List<java.lang.String> getPermissionsBoundaryPoliciesJson() {
            return this.permissionsBoundaryPoliciesJson;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceArns() {
            return this.resourceArns;
        }

        @Override
        public final java.lang.String getResourceHandlingOption() {
            return this.resourceHandlingOption;
        }

        @Override
        public final java.lang.String getResourceOwnerAccountId() {
            return this.resourceOwnerAccountId;
        }

        @Override
        public final java.lang.String getResourcePolicyJson() {
            return this.resourcePolicyJson;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actionNames", om.valueToTree(this.getActionNames()));
            data.set("policySourceArn", om.valueToTree(this.getPolicySourceArn()));
            if (this.getAdditionalPoliciesJson() != null) {
                data.set("additionalPoliciesJson", om.valueToTree(this.getAdditionalPoliciesJson()));
            }
            if (this.getCallerArn() != null) {
                data.set("callerArn", om.valueToTree(this.getCallerArn()));
            }
            if (this.getContext() != null) {
                data.set("context", om.valueToTree(this.getContext()));
            }
            if (this.getPermissionsBoundaryPoliciesJson() != null) {
                data.set("permissionsBoundaryPoliciesJson", om.valueToTree(this.getPermissionsBoundaryPoliciesJson()));
            }
            if (this.getResourceArns() != null) {
                data.set("resourceArns", om.valueToTree(this.getResourceArns()));
            }
            if (this.getResourceHandlingOption() != null) {
                data.set("resourceHandlingOption", om.valueToTree(this.getResourceHandlingOption()));
            }
            if (this.getResourceOwnerAccountId() != null) {
                data.set("resourceOwnerAccountId", om.valueToTree(this.getResourceOwnerAccountId()));
            }
            if (this.getResourcePolicyJson() != null) {
                data.set("resourcePolicyJson", om.valueToTree(this.getResourcePolicyJson()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIamPrincipalPolicySimulationConfig.Jsii$Proxy that = (DataAwsIamPrincipalPolicySimulationConfig.Jsii$Proxy) o;

            if (!actionNames.equals(that.actionNames)) return false;
            if (!policySourceArn.equals(that.policySourceArn)) return false;
            if (this.additionalPoliciesJson != null ? !this.additionalPoliciesJson.equals(that.additionalPoliciesJson) : that.additionalPoliciesJson != null) return false;
            if (this.callerArn != null ? !this.callerArn.equals(that.callerArn) : that.callerArn != null) return false;
            if (this.context != null ? !this.context.equals(that.context) : that.context != null) return false;
            if (this.permissionsBoundaryPoliciesJson != null ? !this.permissionsBoundaryPoliciesJson.equals(that.permissionsBoundaryPoliciesJson) : that.permissionsBoundaryPoliciesJson != null) return false;
            if (this.resourceArns != null ? !this.resourceArns.equals(that.resourceArns) : that.resourceArns != null) return false;
            if (this.resourceHandlingOption != null ? !this.resourceHandlingOption.equals(that.resourceHandlingOption) : that.resourceHandlingOption != null) return false;
            if (this.resourceOwnerAccountId != null ? !this.resourceOwnerAccountId.equals(that.resourceOwnerAccountId) : that.resourceOwnerAccountId != null) return false;
            if (this.resourcePolicyJson != null ? !this.resourcePolicyJson.equals(that.resourcePolicyJson) : that.resourcePolicyJson != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.actionNames.hashCode();
            result = 31 * result + (this.policySourceArn.hashCode());
            result = 31 * result + (this.additionalPoliciesJson != null ? this.additionalPoliciesJson.hashCode() : 0);
            result = 31 * result + (this.callerArn != null ? this.callerArn.hashCode() : 0);
            result = 31 * result + (this.context != null ? this.context.hashCode() : 0);
            result = 31 * result + (this.permissionsBoundaryPoliciesJson != null ? this.permissionsBoundaryPoliciesJson.hashCode() : 0);
            result = 31 * result + (this.resourceArns != null ? this.resourceArns.hashCode() : 0);
            result = 31 * result + (this.resourceHandlingOption != null ? this.resourceHandlingOption.hashCode() : 0);
            result = 31 * result + (this.resourceOwnerAccountId != null ? this.resourceOwnerAccountId.hashCode() : 0);
            result = 31 * result + (this.resourcePolicyJson != null ? this.resourcePolicyJson.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
