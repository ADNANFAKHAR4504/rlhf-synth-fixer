package imports.aws.dynamodb_resource_policy;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy aws_dynamodb_resource_policy}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.052Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbResourcePolicy.DynamodbResourcePolicy")
public class DynamodbResourcePolicy extends com.hashicorp.cdktf.TerraformResource {

    protected DynamodbResourcePolicy(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DynamodbResourcePolicy(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.dynamodb_resource_policy.DynamodbResourcePolicy.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy aws_dynamodb_resource_policy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DynamodbResourcePolicy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.dynamodb_resource_policy.DynamodbResourcePolicyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DynamodbResourcePolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DynamodbResourcePolicy to import. This parameter is required.
     * @param importFromId The id of the existing DynamodbResourcePolicy that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DynamodbResourcePolicy to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dynamodb_resource_policy.DynamodbResourcePolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DynamodbResourcePolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DynamodbResourcePolicy to import. This parameter is required.
     * @param importFromId The id of the existing DynamodbResourcePolicy that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dynamodb_resource_policy.DynamodbResourcePolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetConfirmRemoveSelfResourceAccess() {
        software.amazon.jsii.Kernel.call(this, "resetConfirmRemoveSelfResourceAccess", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRevisionId() {
        return software.amazon.jsii.Kernel.get(this, "revisionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfirmRemoveSelfResourceAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "confirmRemoveSelfResourceAccessInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "policyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getConfirmRemoveSelfResourceAccess() {
        return software.amazon.jsii.Kernel.get(this, "confirmRemoveSelfResourceAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setConfirmRemoveSelfResourceAccess(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "confirmRemoveSelfResourceAccess", java.util.Objects.requireNonNull(value, "confirmRemoveSelfResourceAccess is required"));
    }

    public void setConfirmRemoveSelfResourceAccess(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "confirmRemoveSelfResourceAccess", java.util.Objects.requireNonNull(value, "confirmRemoveSelfResourceAccess is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicy() {
        return software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policy", java.util.Objects.requireNonNull(value, "policy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceArn() {
        return software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceArn", java.util.Objects.requireNonNull(value, "resourceArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.dynamodb_resource_policy.DynamodbResourcePolicy}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.dynamodb_resource_policy.DynamodbResourcePolicy> {
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
        private final imports.aws.dynamodb_resource_policy.DynamodbResourcePolicyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.dynamodb_resource_policy.DynamodbResourcePolicyConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy#policy DynamodbResourcePolicy#policy}.
         * <p>
         * @return {@code this}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy#policy DynamodbResourcePolicy#policy}. This parameter is required.
         */
        public Builder policy(final java.lang.String policy) {
            this.config.policy(policy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy#resource_arn DynamodbResourcePolicy#resource_arn}.
         * <p>
         * @return {@code this}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy#resource_arn DynamodbResourcePolicy#resource_arn}. This parameter is required.
         */
        public Builder resourceArn(final java.lang.String resourceArn) {
            this.config.resourceArn(resourceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy#confirm_remove_self_resource_access DynamodbResourcePolicy#confirm_remove_self_resource_access}.
         * <p>
         * @return {@code this}
         * @param confirmRemoveSelfResourceAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy#confirm_remove_self_resource_access DynamodbResourcePolicy#confirm_remove_self_resource_access}. This parameter is required.
         */
        public Builder confirmRemoveSelfResourceAccess(final java.lang.Boolean confirmRemoveSelfResourceAccess) {
            this.config.confirmRemoveSelfResourceAccess(confirmRemoveSelfResourceAccess);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy#confirm_remove_self_resource_access DynamodbResourcePolicy#confirm_remove_self_resource_access}.
         * <p>
         * @return {@code this}
         * @param confirmRemoveSelfResourceAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_resource_policy#confirm_remove_self_resource_access DynamodbResourcePolicy#confirm_remove_self_resource_access}. This parameter is required.
         */
        public Builder confirmRemoveSelfResourceAccess(final com.hashicorp.cdktf.IResolvable confirmRemoveSelfResourceAccess) {
            this.config.confirmRemoveSelfResourceAccess(confirmRemoveSelfResourceAccess);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.dynamodb_resource_policy.DynamodbResourcePolicy}.
         */
        @Override
        public imports.aws.dynamodb_resource_policy.DynamodbResourcePolicy build() {
            return new imports.aws.dynamodb_resource_policy.DynamodbResourcePolicy(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
