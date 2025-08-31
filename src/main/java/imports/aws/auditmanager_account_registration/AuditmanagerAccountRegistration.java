package imports.aws.auditmanager_account_registration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration aws_auditmanager_account_registration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.082Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerAccountRegistration.AuditmanagerAccountRegistration")
public class AuditmanagerAccountRegistration extends com.hashicorp.cdktf.TerraformResource {

    protected AuditmanagerAccountRegistration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AuditmanagerAccountRegistration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration aws_auditmanager_account_registration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public AuditmanagerAccountRegistration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistrationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration aws_auditmanager_account_registration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public AuditmanagerAccountRegistration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a AuditmanagerAccountRegistration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AuditmanagerAccountRegistration to import. This parameter is required.
     * @param importFromId The id of the existing AuditmanagerAccountRegistration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AuditmanagerAccountRegistration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AuditmanagerAccountRegistration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AuditmanagerAccountRegistration to import. This parameter is required.
     * @param importFromId The id of the existing AuditmanagerAccountRegistration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetDelegatedAdminAccount() {
        software.amazon.jsii.Kernel.call(this, "resetDelegatedAdminAccount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeregisterOnDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetDeregisterOnDestroy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKey() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKey", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getDelegatedAdminAccountInput() {
        return software.amazon.jsii.Kernel.get(this, "delegatedAdminAccountInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeregisterOnDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "deregisterOnDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDelegatedAdminAccount() {
        return software.amazon.jsii.Kernel.get(this, "delegatedAdminAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDelegatedAdminAccount(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "delegatedAdminAccount", java.util.Objects.requireNonNull(value, "delegatedAdminAccount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeregisterOnDestroy() {
        return software.amazon.jsii.Kernel.get(this, "deregisterOnDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeregisterOnDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deregisterOnDestroy", java.util.Objects.requireNonNull(value, "deregisterOnDestroy is required"));
    }

    public void setDeregisterOnDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deregisterOnDestroy", java.util.Objects.requireNonNull(value, "deregisterOnDestroy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKey() {
        return software.amazon.jsii.Kernel.get(this, "kmsKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKey", java.util.Objects.requireNonNull(value, "kmsKey is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistration> {
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
        private imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistrationConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration#delegated_admin_account AuditmanagerAccountRegistration#delegated_admin_account}.
         * <p>
         * @return {@code this}
         * @param delegatedAdminAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration#delegated_admin_account AuditmanagerAccountRegistration#delegated_admin_account}. This parameter is required.
         */
        public Builder delegatedAdminAccount(final java.lang.String delegatedAdminAccount) {
            this.config().delegatedAdminAccount(delegatedAdminAccount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration#deregister_on_destroy AuditmanagerAccountRegistration#deregister_on_destroy}.
         * <p>
         * @return {@code this}
         * @param deregisterOnDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration#deregister_on_destroy AuditmanagerAccountRegistration#deregister_on_destroy}. This parameter is required.
         */
        public Builder deregisterOnDestroy(final java.lang.Boolean deregisterOnDestroy) {
            this.config().deregisterOnDestroy(deregisterOnDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration#deregister_on_destroy AuditmanagerAccountRegistration#deregister_on_destroy}.
         * <p>
         * @return {@code this}
         * @param deregisterOnDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration#deregister_on_destroy AuditmanagerAccountRegistration#deregister_on_destroy}. This parameter is required.
         */
        public Builder deregisterOnDestroy(final com.hashicorp.cdktf.IResolvable deregisterOnDestroy) {
            this.config().deregisterOnDestroy(deregisterOnDestroy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration#kms_key AuditmanagerAccountRegistration#kms_key}.
         * <p>
         * @return {@code this}
         * @param kmsKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_account_registration#kms_key AuditmanagerAccountRegistration#kms_key}. This parameter is required.
         */
        public Builder kmsKey(final java.lang.String kmsKey) {
            this.config().kmsKey(kmsKey);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistration}.
         */
        @Override
        public imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistration build() {
            return new imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistration(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistrationConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.auditmanager_account_registration.AuditmanagerAccountRegistrationConfig.Builder();
            }
            return this.config;
        }
    }
}
