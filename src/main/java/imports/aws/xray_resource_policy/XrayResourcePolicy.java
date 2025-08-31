package imports.aws.xray_resource_policy;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy aws_xray_resource_policy}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.697Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.xrayResourcePolicy.XrayResourcePolicy")
public class XrayResourcePolicy extends com.hashicorp.cdktf.TerraformResource {

    protected XrayResourcePolicy(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected XrayResourcePolicy(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.xray_resource_policy.XrayResourcePolicy.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy aws_xray_resource_policy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public XrayResourcePolicy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.xray_resource_policy.XrayResourcePolicyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a XrayResourcePolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the XrayResourcePolicy to import. This parameter is required.
     * @param importFromId The id of the existing XrayResourcePolicy that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the XrayResourcePolicy to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.xray_resource_policy.XrayResourcePolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a XrayResourcePolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the XrayResourcePolicy to import. This parameter is required.
     * @param importFromId The id of the existing XrayResourcePolicy that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.xray_resource_policy.XrayResourcePolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetBypassPolicyLockoutCheck() {
        software.amazon.jsii.Kernel.call(this, "resetBypassPolicyLockoutCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicyRevisionId() {
        software.amazon.jsii.Kernel.call(this, "resetPolicyRevisionId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getLastUpdatedTime() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdatedTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBypassPolicyLockoutCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "bypassPolicyLockoutCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyDocumentInput() {
        return software.amazon.jsii.Kernel.get(this, "policyDocumentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "policyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyRevisionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "policyRevisionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBypassPolicyLockoutCheck() {
        return software.amazon.jsii.Kernel.get(this, "bypassPolicyLockoutCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBypassPolicyLockoutCheck(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "bypassPolicyLockoutCheck", java.util.Objects.requireNonNull(value, "bypassPolicyLockoutCheck is required"));
    }

    public void setBypassPolicyLockoutCheck(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "bypassPolicyLockoutCheck", java.util.Objects.requireNonNull(value, "bypassPolicyLockoutCheck is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyDocument() {
        return software.amazon.jsii.Kernel.get(this, "policyDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyDocument(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyDocument", java.util.Objects.requireNonNull(value, "policyDocument is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyName() {
        return software.amazon.jsii.Kernel.get(this, "policyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyName", java.util.Objects.requireNonNull(value, "policyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyRevisionId() {
        return software.amazon.jsii.Kernel.get(this, "policyRevisionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyRevisionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyRevisionId", java.util.Objects.requireNonNull(value, "policyRevisionId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.xray_resource_policy.XrayResourcePolicy}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.xray_resource_policy.XrayResourcePolicy> {
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
        private final imports.aws.xray_resource_policy.XrayResourcePolicyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.xray_resource_policy.XrayResourcePolicyConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#policy_document XrayResourcePolicy#policy_document}.
         * <p>
         * @return {@code this}
         * @param policyDocument Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#policy_document XrayResourcePolicy#policy_document}. This parameter is required.
         */
        public Builder policyDocument(final java.lang.String policyDocument) {
            this.config.policyDocument(policyDocument);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#policy_name XrayResourcePolicy#policy_name}.
         * <p>
         * @return {@code this}
         * @param policyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#policy_name XrayResourcePolicy#policy_name}. This parameter is required.
         */
        public Builder policyName(final java.lang.String policyName) {
            this.config.policyName(policyName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#bypass_policy_lockout_check XrayResourcePolicy#bypass_policy_lockout_check}.
         * <p>
         * @return {@code this}
         * @param bypassPolicyLockoutCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#bypass_policy_lockout_check XrayResourcePolicy#bypass_policy_lockout_check}. This parameter is required.
         */
        public Builder bypassPolicyLockoutCheck(final java.lang.Boolean bypassPolicyLockoutCheck) {
            this.config.bypassPolicyLockoutCheck(bypassPolicyLockoutCheck);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#bypass_policy_lockout_check XrayResourcePolicy#bypass_policy_lockout_check}.
         * <p>
         * @return {@code this}
         * @param bypassPolicyLockoutCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#bypass_policy_lockout_check XrayResourcePolicy#bypass_policy_lockout_check}. This parameter is required.
         */
        public Builder bypassPolicyLockoutCheck(final com.hashicorp.cdktf.IResolvable bypassPolicyLockoutCheck) {
            this.config.bypassPolicyLockoutCheck(bypassPolicyLockoutCheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#policy_revision_id XrayResourcePolicy#policy_revision_id}.
         * <p>
         * @return {@code this}
         * @param policyRevisionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_resource_policy#policy_revision_id XrayResourcePolicy#policy_revision_id}. This parameter is required.
         */
        public Builder policyRevisionId(final java.lang.String policyRevisionId) {
            this.config.policyRevisionId(policyRevisionId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.xray_resource_policy.XrayResourcePolicy}.
         */
        @Override
        public imports.aws.xray_resource_policy.XrayResourcePolicy build() {
            return new imports.aws.xray_resource_policy.XrayResourcePolicy(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
