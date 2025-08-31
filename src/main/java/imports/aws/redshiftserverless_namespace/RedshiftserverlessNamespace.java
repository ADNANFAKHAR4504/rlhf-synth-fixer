package imports.aws.redshiftserverless_namespace;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace aws_redshiftserverless_namespace}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.174Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftserverlessNamespace.RedshiftserverlessNamespace")
public class RedshiftserverlessNamespace extends com.hashicorp.cdktf.TerraformResource {

    protected RedshiftserverlessNamespace(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftserverlessNamespace(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespace.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace aws_redshiftserverless_namespace} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public RedshiftserverlessNamespace(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespaceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a RedshiftserverlessNamespace resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftserverlessNamespace to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftserverlessNamespace that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the RedshiftserverlessNamespace to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespace.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a RedshiftserverlessNamespace resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftserverlessNamespace to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftserverlessNamespace that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespace.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAdminPasswordSecretKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetAdminPasswordSecretKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdminUsername() {
        software.amazon.jsii.Kernel.call(this, "resetAdminUsername", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdminUserPassword() {
        software.amazon.jsii.Kernel.call(this, "resetAdminUserPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdminUserPasswordWo() {
        software.amazon.jsii.Kernel.call(this, "resetAdminUserPasswordWo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdminUserPasswordWoVersion() {
        software.amazon.jsii.Kernel.call(this, "resetAdminUserPasswordWoVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbName() {
        software.amazon.jsii.Kernel.call(this, "resetDbName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultIamRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultIamRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamRoles() {
        software.amazon.jsii.Kernel.call(this, "resetIamRoles", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogExports() {
        software.amazon.jsii.Kernel.call(this, "resetLogExports", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManageAdminPassword() {
        software.amazon.jsii.Kernel.call(this, "resetManageAdminPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAdminPasswordSecretArn() {
        return software.amazon.jsii.Kernel.get(this, "adminPasswordSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespaceId() {
        return software.amazon.jsii.Kernel.get(this, "namespaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdminPasswordSecretKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "adminPasswordSecretKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdminUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "adminUsernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdminUserPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "adminUserPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdminUserPasswordWoInput() {
        return software.amazon.jsii.Kernel.get(this, "adminUserPasswordWoInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAdminUserPasswordWoVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "adminUserPasswordWoVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dbNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultIamRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultIamRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIamRolesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "iamRolesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLogExportsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "logExportsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getManageAdminPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "manageAdminPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamespaceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "namespaceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdminPasswordSecretKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "adminPasswordSecretKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdminPasswordSecretKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adminPasswordSecretKmsKeyId", java.util.Objects.requireNonNull(value, "adminPasswordSecretKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdminUsername() {
        return software.amazon.jsii.Kernel.get(this, "adminUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdminUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adminUsername", java.util.Objects.requireNonNull(value, "adminUsername is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdminUserPassword() {
        return software.amazon.jsii.Kernel.get(this, "adminUserPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdminUserPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adminUserPassword", java.util.Objects.requireNonNull(value, "adminUserPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdminUserPasswordWo() {
        return software.amazon.jsii.Kernel.get(this, "adminUserPasswordWo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdminUserPasswordWo(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adminUserPasswordWo", java.util.Objects.requireNonNull(value, "adminUserPasswordWo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAdminUserPasswordWoVersion() {
        return software.amazon.jsii.Kernel.get(this, "adminUserPasswordWoVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAdminUserPasswordWoVersion(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "adminUserPasswordWoVersion", java.util.Objects.requireNonNull(value, "adminUserPasswordWoVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbName() {
        return software.amazon.jsii.Kernel.get(this, "dbName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbName", java.util.Objects.requireNonNull(value, "dbName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultIamRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "defaultIamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultIamRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultIamRoleArn", java.util.Objects.requireNonNull(value, "defaultIamRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIamRoles() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "iamRoles", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIamRoles(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "iamRoles", java.util.Objects.requireNonNull(value, "iamRoles is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLogExports() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "logExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLogExports(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "logExports", java.util.Objects.requireNonNull(value, "logExports is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getManageAdminPassword() {
        return software.amazon.jsii.Kernel.get(this, "manageAdminPassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setManageAdminPassword(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "manageAdminPassword", java.util.Objects.requireNonNull(value, "manageAdminPassword is required"));
    }

    public void setManageAdminPassword(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "manageAdminPassword", java.util.Objects.requireNonNull(value, "manageAdminPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespaceName() {
        return software.amazon.jsii.Kernel.get(this, "namespaceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamespaceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namespaceName", java.util.Objects.requireNonNull(value, "namespaceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespace}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespace> {
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
        private final imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespaceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespaceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#namespace_name RedshiftserverlessNamespace#namespace_name}.
         * <p>
         * @return {@code this}
         * @param namespaceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#namespace_name RedshiftserverlessNamespace#namespace_name}. This parameter is required.
         */
        public Builder namespaceName(final java.lang.String namespaceName) {
            this.config.namespaceName(namespaceName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_password_secret_kms_key_id RedshiftserverlessNamespace#admin_password_secret_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param adminPasswordSecretKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_password_secret_kms_key_id RedshiftserverlessNamespace#admin_password_secret_kms_key_id}. This parameter is required.
         */
        public Builder adminPasswordSecretKmsKeyId(final java.lang.String adminPasswordSecretKmsKeyId) {
            this.config.adminPasswordSecretKmsKeyId(adminPasswordSecretKmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_username RedshiftserverlessNamespace#admin_username}.
         * <p>
         * @return {@code this}
         * @param adminUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_username RedshiftserverlessNamespace#admin_username}. This parameter is required.
         */
        public Builder adminUsername(final java.lang.String adminUsername) {
            this.config.adminUsername(adminUsername);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password RedshiftserverlessNamespace#admin_user_password}.
         * <p>
         * @return {@code this}
         * @param adminUserPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password RedshiftserverlessNamespace#admin_user_password}. This parameter is required.
         */
        public Builder adminUserPassword(final java.lang.String adminUserPassword) {
            this.config.adminUserPassword(adminUserPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password_wo RedshiftserverlessNamespace#admin_user_password_wo}.
         * <p>
         * @return {@code this}
         * @param adminUserPasswordWo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password_wo RedshiftserverlessNamespace#admin_user_password_wo}. This parameter is required.
         */
        public Builder adminUserPasswordWo(final java.lang.String adminUserPasswordWo) {
            this.config.adminUserPasswordWo(adminUserPasswordWo);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password_wo_version RedshiftserverlessNamespace#admin_user_password_wo_version}.
         * <p>
         * @return {@code this}
         * @param adminUserPasswordWoVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password_wo_version RedshiftserverlessNamespace#admin_user_password_wo_version}. This parameter is required.
         */
        public Builder adminUserPasswordWoVersion(final java.lang.Number adminUserPasswordWoVersion) {
            this.config.adminUserPasswordWoVersion(adminUserPasswordWoVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#db_name RedshiftserverlessNamespace#db_name}.
         * <p>
         * @return {@code this}
         * @param dbName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#db_name RedshiftserverlessNamespace#db_name}. This parameter is required.
         */
        public Builder dbName(final java.lang.String dbName) {
            this.config.dbName(dbName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#default_iam_role_arn RedshiftserverlessNamespace#default_iam_role_arn}.
         * <p>
         * @return {@code this}
         * @param defaultIamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#default_iam_role_arn RedshiftserverlessNamespace#default_iam_role_arn}. This parameter is required.
         */
        public Builder defaultIamRoleArn(final java.lang.String defaultIamRoleArn) {
            this.config.defaultIamRoleArn(defaultIamRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#iam_roles RedshiftserverlessNamespace#iam_roles}.
         * <p>
         * @return {@code this}
         * @param iamRoles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#iam_roles RedshiftserverlessNamespace#iam_roles}. This parameter is required.
         */
        public Builder iamRoles(final java.util.List<java.lang.String> iamRoles) {
            this.config.iamRoles(iamRoles);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#id RedshiftserverlessNamespace#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#id RedshiftserverlessNamespace#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#kms_key_id RedshiftserverlessNamespace#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#kms_key_id RedshiftserverlessNamespace#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#log_exports RedshiftserverlessNamespace#log_exports}.
         * <p>
         * @return {@code this}
         * @param logExports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#log_exports RedshiftserverlessNamespace#log_exports}. This parameter is required.
         */
        public Builder logExports(final java.util.List<java.lang.String> logExports) {
            this.config.logExports(logExports);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#manage_admin_password RedshiftserverlessNamespace#manage_admin_password}.
         * <p>
         * @return {@code this}
         * @param manageAdminPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#manage_admin_password RedshiftserverlessNamespace#manage_admin_password}. This parameter is required.
         */
        public Builder manageAdminPassword(final java.lang.Boolean manageAdminPassword) {
            this.config.manageAdminPassword(manageAdminPassword);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#manage_admin_password RedshiftserverlessNamespace#manage_admin_password}.
         * <p>
         * @return {@code this}
         * @param manageAdminPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#manage_admin_password RedshiftserverlessNamespace#manage_admin_password}. This parameter is required.
         */
        public Builder manageAdminPassword(final com.hashicorp.cdktf.IResolvable manageAdminPassword) {
            this.config.manageAdminPassword(manageAdminPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#tags RedshiftserverlessNamespace#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#tags RedshiftserverlessNamespace#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#tags_all RedshiftserverlessNamespace#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#tags_all RedshiftserverlessNamespace#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespace}.
         */
        @Override
        public imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespace build() {
            return new imports.aws.redshiftserverless_namespace.RedshiftserverlessNamespace(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
