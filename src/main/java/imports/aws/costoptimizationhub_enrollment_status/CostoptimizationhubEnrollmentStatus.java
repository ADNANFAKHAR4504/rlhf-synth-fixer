package imports.aws.costoptimizationhub_enrollment_status;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/costoptimizationhub_enrollment_status aws_costoptimizationhub_enrollment_status}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.398Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.costoptimizationhubEnrollmentStatus.CostoptimizationhubEnrollmentStatus")
public class CostoptimizationhubEnrollmentStatus extends com.hashicorp.cdktf.TerraformResource {

    protected CostoptimizationhubEnrollmentStatus(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CostoptimizationhubEnrollmentStatus(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatus.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/costoptimizationhub_enrollment_status aws_costoptimizationhub_enrollment_status} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public CostoptimizationhubEnrollmentStatus(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatusConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/costoptimizationhub_enrollment_status aws_costoptimizationhub_enrollment_status} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public CostoptimizationhubEnrollmentStatus(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a CostoptimizationhubEnrollmentStatus resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CostoptimizationhubEnrollmentStatus to import. This parameter is required.
     * @param importFromId The id of the existing CostoptimizationhubEnrollmentStatus that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CostoptimizationhubEnrollmentStatus to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatus.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CostoptimizationhubEnrollmentStatus resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CostoptimizationhubEnrollmentStatus to import. This parameter is required.
     * @param importFromId The id of the existing CostoptimizationhubEnrollmentStatus that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatus.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetIncludeMemberAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeMemberAccounts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeMemberAccountsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeMemberAccountsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeMemberAccounts() {
        return software.amazon.jsii.Kernel.get(this, "includeMemberAccounts", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeMemberAccounts(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeMemberAccounts", java.util.Objects.requireNonNull(value, "includeMemberAccounts is required"));
    }

    public void setIncludeMemberAccounts(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeMemberAccounts", java.util.Objects.requireNonNull(value, "includeMemberAccounts is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatus}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatus> {
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
        private imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatusConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/costoptimizationhub_enrollment_status#include_member_accounts CostoptimizationhubEnrollmentStatus#include_member_accounts}.
         * <p>
         * @return {@code this}
         * @param includeMemberAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/costoptimizationhub_enrollment_status#include_member_accounts CostoptimizationhubEnrollmentStatus#include_member_accounts}. This parameter is required.
         */
        public Builder includeMemberAccounts(final java.lang.Boolean includeMemberAccounts) {
            this.config().includeMemberAccounts(includeMemberAccounts);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/costoptimizationhub_enrollment_status#include_member_accounts CostoptimizationhubEnrollmentStatus#include_member_accounts}.
         * <p>
         * @return {@code this}
         * @param includeMemberAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/costoptimizationhub_enrollment_status#include_member_accounts CostoptimizationhubEnrollmentStatus#include_member_accounts}. This parameter is required.
         */
        public Builder includeMemberAccounts(final com.hashicorp.cdktf.IResolvable includeMemberAccounts) {
            this.config().includeMemberAccounts(includeMemberAccounts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatus}.
         */
        @Override
        public imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatus build() {
            return new imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatus(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatusConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.costoptimizationhub_enrollment_status.CostoptimizationhubEnrollmentStatusConfig.Builder();
            }
            return this.config;
        }
    }
}
