package imports.aws.quicksight_iam_policy_assignment;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment aws_quicksight_iam_policy_assignment}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.120Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightIamPolicyAssignment.QuicksightIamPolicyAssignment")
public class QuicksightIamPolicyAssignment extends com.hashicorp.cdktf.TerraformResource {

    protected QuicksightIamPolicyAssignment(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightIamPolicyAssignment(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignment.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment aws_quicksight_iam_policy_assignment} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public QuicksightIamPolicyAssignment(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a QuicksightIamPolicyAssignment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightIamPolicyAssignment to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightIamPolicyAssignment that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the QuicksightIamPolicyAssignment to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a QuicksightIamPolicyAssignment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightIamPolicyAssignment to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightIamPolicyAssignment that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putIdentities(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentIdentities>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentIdentities> __cast_cd4240 = (java.util.List<imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentIdentities>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentIdentities __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putIdentities", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentities() {
        software.amazon.jsii.Kernel.call(this, "resetIdentities", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamespace() {
        software.amazon.jsii.Kernel.call(this, "resetNamespace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicyArn() {
        software.amazon.jsii.Kernel.call(this, "resetPolicyArn", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAssignmentId() {
        return software.amazon.jsii.Kernel.get(this, "assignmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentIdentitiesList getIdentities() {
        return software.amazon.jsii.Kernel.get(this, "identities", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentIdentitiesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssignmentNameInput() {
        return software.amazon.jsii.Kernel.get(this, "assignmentNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssignmentStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "assignmentStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIdentitiesInput() {
        return software.amazon.jsii.Kernel.get(this, "identitiesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "namespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "policyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssignmentName() {
        return software.amazon.jsii.Kernel.get(this, "assignmentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssignmentName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "assignmentName", java.util.Objects.requireNonNull(value, "assignmentName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssignmentStatus() {
        return software.amazon.jsii.Kernel.get(this, "assignmentStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssignmentStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "assignmentStatus", java.util.Objects.requireNonNull(value, "assignmentStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsAccountId", java.util.Objects.requireNonNull(value, "awsAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespace() {
        return software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namespace", java.util.Objects.requireNonNull(value, "namespace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyArn() {
        return software.amazon.jsii.Kernel.get(this, "policyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyArn", java.util.Objects.requireNonNull(value, "policyArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignment}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignment> {
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
        private final imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#assignment_name QuicksightIamPolicyAssignment#assignment_name}.
         * <p>
         * @return {@code this}
         * @param assignmentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#assignment_name QuicksightIamPolicyAssignment#assignment_name}. This parameter is required.
         */
        public Builder assignmentName(final java.lang.String assignmentName) {
            this.config.assignmentName(assignmentName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#assignment_status QuicksightIamPolicyAssignment#assignment_status}.
         * <p>
         * @return {@code this}
         * @param assignmentStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#assignment_status QuicksightIamPolicyAssignment#assignment_status}. This parameter is required.
         */
        public Builder assignmentStatus(final java.lang.String assignmentStatus) {
            this.config.assignmentStatus(assignmentStatus);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#aws_account_id QuicksightIamPolicyAssignment#aws_account_id}.
         * <p>
         * @return {@code this}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#aws_account_id QuicksightIamPolicyAssignment#aws_account_id}. This parameter is required.
         */
        public Builder awsAccountId(final java.lang.String awsAccountId) {
            this.config.awsAccountId(awsAccountId);
            return this;
        }

        /**
         * identities block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#identities QuicksightIamPolicyAssignment#identities}
         * <p>
         * @return {@code this}
         * @param identities identities block. This parameter is required.
         */
        public Builder identities(final com.hashicorp.cdktf.IResolvable identities) {
            this.config.identities(identities);
            return this;
        }
        /**
         * identities block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#identities QuicksightIamPolicyAssignment#identities}
         * <p>
         * @return {@code this}
         * @param identities identities block. This parameter is required.
         */
        public Builder identities(final java.util.List<? extends imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignmentIdentities> identities) {
            this.config.identities(identities);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#namespace QuicksightIamPolicyAssignment#namespace}.
         * <p>
         * @return {@code this}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#namespace QuicksightIamPolicyAssignment#namespace}. This parameter is required.
         */
        public Builder namespace(final java.lang.String namespace) {
            this.config.namespace(namespace);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#policy_arn QuicksightIamPolicyAssignment#policy_arn}.
         * <p>
         * @return {@code this}
         * @param policyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#policy_arn QuicksightIamPolicyAssignment#policy_arn}. This parameter is required.
         */
        public Builder policyArn(final java.lang.String policyArn) {
            this.config.policyArn(policyArn);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignment}.
         */
        @Override
        public imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignment build() {
            return new imports.aws.quicksight_iam_policy_assignment.QuicksightIamPolicyAssignment(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
