package imports.aws.signer_signing_profile_permission;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission aws_signer_signing_profile_permission}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.474Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.signerSigningProfilePermission.SignerSigningProfilePermission")
public class SignerSigningProfilePermission extends com.hashicorp.cdktf.TerraformResource {

    protected SignerSigningProfilePermission(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SignerSigningProfilePermission(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.signer_signing_profile_permission.SignerSigningProfilePermission.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission aws_signer_signing_profile_permission} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SignerSigningProfilePermission(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.signer_signing_profile_permission.SignerSigningProfilePermissionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SignerSigningProfilePermission resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SignerSigningProfilePermission to import. This parameter is required.
     * @param importFromId The id of the existing SignerSigningProfilePermission that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SignerSigningProfilePermission to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.signer_signing_profile_permission.SignerSigningProfilePermission.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SignerSigningProfilePermission resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SignerSigningProfilePermission to import. This parameter is required.
     * @param importFromId The id of the existing SignerSigningProfilePermission that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.signer_signing_profile_permission.SignerSigningProfilePermission.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProfileVersion() {
        software.amazon.jsii.Kernel.call(this, "resetProfileVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatementId() {
        software.amazon.jsii.Kernel.call(this, "resetStatementId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatementIdPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetStatementIdPrefix", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "principalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProfileNameInput() {
        return software.amazon.jsii.Kernel.get(this, "profileNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProfileVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "profileVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatementIdInput() {
        return software.amazon.jsii.Kernel.get(this, "statementIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatementIdPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "statementIdPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "action", java.util.Objects.requireNonNull(value, "action is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrincipal() {
        return software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrincipal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "principal", java.util.Objects.requireNonNull(value, "principal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfileName() {
        return software.amazon.jsii.Kernel.get(this, "profileName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProfileName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "profileName", java.util.Objects.requireNonNull(value, "profileName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfileVersion() {
        return software.amazon.jsii.Kernel.get(this, "profileVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProfileVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "profileVersion", java.util.Objects.requireNonNull(value, "profileVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatementId() {
        return software.amazon.jsii.Kernel.get(this, "statementId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatementId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statementId", java.util.Objects.requireNonNull(value, "statementId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatementIdPrefix() {
        return software.amazon.jsii.Kernel.get(this, "statementIdPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatementIdPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statementIdPrefix", java.util.Objects.requireNonNull(value, "statementIdPrefix is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.signer_signing_profile_permission.SignerSigningProfilePermission}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.signer_signing_profile_permission.SignerSigningProfilePermission> {
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
        private final imports.aws.signer_signing_profile_permission.SignerSigningProfilePermissionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.signer_signing_profile_permission.SignerSigningProfilePermissionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#action SignerSigningProfilePermission#action}.
         * <p>
         * @return {@code this}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#action SignerSigningProfilePermission#action}. This parameter is required.
         */
        public Builder action(final java.lang.String action) {
            this.config.action(action);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#principal SignerSigningProfilePermission#principal}.
         * <p>
         * @return {@code this}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#principal SignerSigningProfilePermission#principal}. This parameter is required.
         */
        public Builder principal(final java.lang.String principal) {
            this.config.principal(principal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#profile_name SignerSigningProfilePermission#profile_name}.
         * <p>
         * @return {@code this}
         * @param profileName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#profile_name SignerSigningProfilePermission#profile_name}. This parameter is required.
         */
        public Builder profileName(final java.lang.String profileName) {
            this.config.profileName(profileName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#id SignerSigningProfilePermission#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#id SignerSigningProfilePermission#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#profile_version SignerSigningProfilePermission#profile_version}.
         * <p>
         * @return {@code this}
         * @param profileVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#profile_version SignerSigningProfilePermission#profile_version}. This parameter is required.
         */
        public Builder profileVersion(final java.lang.String profileVersion) {
            this.config.profileVersion(profileVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#statement_id SignerSigningProfilePermission#statement_id}.
         * <p>
         * @return {@code this}
         * @param statementId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#statement_id SignerSigningProfilePermission#statement_id}. This parameter is required.
         */
        public Builder statementId(final java.lang.String statementId) {
            this.config.statementId(statementId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#statement_id_prefix SignerSigningProfilePermission#statement_id_prefix}.
         * <p>
         * @return {@code this}
         * @param statementIdPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_profile_permission#statement_id_prefix SignerSigningProfilePermission#statement_id_prefix}. This parameter is required.
         */
        public Builder statementIdPrefix(final java.lang.String statementIdPrefix) {
            this.config.statementIdPrefix(statementIdPrefix);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.signer_signing_profile_permission.SignerSigningProfilePermission}.
         */
        @Override
        public imports.aws.signer_signing_profile_permission.SignerSigningProfilePermission build() {
            return new imports.aws.signer_signing_profile_permission.SignerSigningProfilePermission(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
