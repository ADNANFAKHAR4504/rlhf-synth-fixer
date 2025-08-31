package imports.aws.redshiftserverless_namespace;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.174Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftserverlessNamespace.RedshiftserverlessNamespaceConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftserverlessNamespaceConfig.Jsii$Proxy.class)
public interface RedshiftserverlessNamespaceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#namespace_name RedshiftserverlessNamespace#namespace_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamespaceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_password_secret_kms_key_id RedshiftserverlessNamespace#admin_password_secret_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdminPasswordSecretKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_username RedshiftserverlessNamespace#admin_username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdminUsername() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password RedshiftserverlessNamespace#admin_user_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdminUserPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password_wo RedshiftserverlessNamespace#admin_user_password_wo}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdminUserPasswordWo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password_wo_version RedshiftserverlessNamespace#admin_user_password_wo_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAdminUserPasswordWoVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#db_name RedshiftserverlessNamespace#db_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#default_iam_role_arn RedshiftserverlessNamespace#default_iam_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultIamRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#iam_roles RedshiftserverlessNamespace#iam_roles}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIamRoles() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#id RedshiftserverlessNamespace#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#kms_key_id RedshiftserverlessNamespace#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#log_exports RedshiftserverlessNamespace#log_exports}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLogExports() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#manage_admin_password RedshiftserverlessNamespace#manage_admin_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getManageAdminPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#tags RedshiftserverlessNamespace#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#tags_all RedshiftserverlessNamespace#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftserverlessNamespaceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftserverlessNamespaceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftserverlessNamespaceConfig> {
        java.lang.String namespaceName;
        java.lang.String adminPasswordSecretKmsKeyId;
        java.lang.String adminUsername;
        java.lang.String adminUserPassword;
        java.lang.String adminUserPasswordWo;
        java.lang.Number adminUserPasswordWoVersion;
        java.lang.String dbName;
        java.lang.String defaultIamRoleArn;
        java.util.List<java.lang.String> iamRoles;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.util.List<java.lang.String> logExports;
        java.lang.Object manageAdminPassword;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getNamespaceName}
         * @param namespaceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#namespace_name RedshiftserverlessNamespace#namespace_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder namespaceName(java.lang.String namespaceName) {
            this.namespaceName = namespaceName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getAdminPasswordSecretKmsKeyId}
         * @param adminPasswordSecretKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_password_secret_kms_key_id RedshiftserverlessNamespace#admin_password_secret_kms_key_id}.
         * @return {@code this}
         */
        public Builder adminPasswordSecretKmsKeyId(java.lang.String adminPasswordSecretKmsKeyId) {
            this.adminPasswordSecretKmsKeyId = adminPasswordSecretKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getAdminUsername}
         * @param adminUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_username RedshiftserverlessNamespace#admin_username}.
         * @return {@code this}
         */
        public Builder adminUsername(java.lang.String adminUsername) {
            this.adminUsername = adminUsername;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getAdminUserPassword}
         * @param adminUserPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password RedshiftserverlessNamespace#admin_user_password}.
         * @return {@code this}
         */
        public Builder adminUserPassword(java.lang.String adminUserPassword) {
            this.adminUserPassword = adminUserPassword;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getAdminUserPasswordWo}
         * @param adminUserPasswordWo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password_wo RedshiftserverlessNamespace#admin_user_password_wo}.
         * @return {@code this}
         */
        public Builder adminUserPasswordWo(java.lang.String adminUserPasswordWo) {
            this.adminUserPasswordWo = adminUserPasswordWo;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getAdminUserPasswordWoVersion}
         * @param adminUserPasswordWoVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#admin_user_password_wo_version RedshiftserverlessNamespace#admin_user_password_wo_version}.
         * @return {@code this}
         */
        public Builder adminUserPasswordWoVersion(java.lang.Number adminUserPasswordWoVersion) {
            this.adminUserPasswordWoVersion = adminUserPasswordWoVersion;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getDbName}
         * @param dbName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#db_name RedshiftserverlessNamespace#db_name}.
         * @return {@code this}
         */
        public Builder dbName(java.lang.String dbName) {
            this.dbName = dbName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getDefaultIamRoleArn}
         * @param defaultIamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#default_iam_role_arn RedshiftserverlessNamespace#default_iam_role_arn}.
         * @return {@code this}
         */
        public Builder defaultIamRoleArn(java.lang.String defaultIamRoleArn) {
            this.defaultIamRoleArn = defaultIamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getIamRoles}
         * @param iamRoles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#iam_roles RedshiftserverlessNamespace#iam_roles}.
         * @return {@code this}
         */
        public Builder iamRoles(java.util.List<java.lang.String> iamRoles) {
            this.iamRoles = iamRoles;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#id RedshiftserverlessNamespace#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#kms_key_id RedshiftserverlessNamespace#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getLogExports}
         * @param logExports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#log_exports RedshiftserverlessNamespace#log_exports}.
         * @return {@code this}
         */
        public Builder logExports(java.util.List<java.lang.String> logExports) {
            this.logExports = logExports;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getManageAdminPassword}
         * @param manageAdminPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#manage_admin_password RedshiftserverlessNamespace#manage_admin_password}.
         * @return {@code this}
         */
        public Builder manageAdminPassword(java.lang.Boolean manageAdminPassword) {
            this.manageAdminPassword = manageAdminPassword;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getManageAdminPassword}
         * @param manageAdminPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#manage_admin_password RedshiftserverlessNamespace#manage_admin_password}.
         * @return {@code this}
         */
        public Builder manageAdminPassword(com.hashicorp.cdktf.IResolvable manageAdminPassword) {
            this.manageAdminPassword = manageAdminPassword;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#tags RedshiftserverlessNamespace#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_namespace#tags_all RedshiftserverlessNamespace#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getDependsOn}
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
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessNamespaceConfig#getProvisioners}
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
         * @return a new instance of {@link RedshiftserverlessNamespaceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftserverlessNamespaceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftserverlessNamespaceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftserverlessNamespaceConfig {
        private final java.lang.String namespaceName;
        private final java.lang.String adminPasswordSecretKmsKeyId;
        private final java.lang.String adminUsername;
        private final java.lang.String adminUserPassword;
        private final java.lang.String adminUserPasswordWo;
        private final java.lang.Number adminUserPasswordWoVersion;
        private final java.lang.String dbName;
        private final java.lang.String defaultIamRoleArn;
        private final java.util.List<java.lang.String> iamRoles;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.util.List<java.lang.String> logExports;
        private final java.lang.Object manageAdminPassword;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.namespaceName = software.amazon.jsii.Kernel.get(this, "namespaceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adminPasswordSecretKmsKeyId = software.amazon.jsii.Kernel.get(this, "adminPasswordSecretKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adminUsername = software.amazon.jsii.Kernel.get(this, "adminUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adminUserPassword = software.amazon.jsii.Kernel.get(this, "adminUserPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adminUserPasswordWo = software.amazon.jsii.Kernel.get(this, "adminUserPasswordWo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adminUserPasswordWoVersion = software.amazon.jsii.Kernel.get(this, "adminUserPasswordWoVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.dbName = software.amazon.jsii.Kernel.get(this, "dbName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultIamRoleArn = software.amazon.jsii.Kernel.get(this, "defaultIamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamRoles = software.amazon.jsii.Kernel.get(this, "iamRoles", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logExports = software.amazon.jsii.Kernel.get(this, "logExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.manageAdminPassword = software.amazon.jsii.Kernel.get(this, "manageAdminPassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.namespaceName = java.util.Objects.requireNonNull(builder.namespaceName, "namespaceName is required");
            this.adminPasswordSecretKmsKeyId = builder.adminPasswordSecretKmsKeyId;
            this.adminUsername = builder.adminUsername;
            this.adminUserPassword = builder.adminUserPassword;
            this.adminUserPasswordWo = builder.adminUserPasswordWo;
            this.adminUserPasswordWoVersion = builder.adminUserPasswordWoVersion;
            this.dbName = builder.dbName;
            this.defaultIamRoleArn = builder.defaultIamRoleArn;
            this.iamRoles = builder.iamRoles;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.logExports = builder.logExports;
            this.manageAdminPassword = builder.manageAdminPassword;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getNamespaceName() {
            return this.namespaceName;
        }

        @Override
        public final java.lang.String getAdminPasswordSecretKmsKeyId() {
            return this.adminPasswordSecretKmsKeyId;
        }

        @Override
        public final java.lang.String getAdminUsername() {
            return this.adminUsername;
        }

        @Override
        public final java.lang.String getAdminUserPassword() {
            return this.adminUserPassword;
        }

        @Override
        public final java.lang.String getAdminUserPasswordWo() {
            return this.adminUserPasswordWo;
        }

        @Override
        public final java.lang.Number getAdminUserPasswordWoVersion() {
            return this.adminUserPasswordWoVersion;
        }

        @Override
        public final java.lang.String getDbName() {
            return this.dbName;
        }

        @Override
        public final java.lang.String getDefaultIamRoleArn() {
            return this.defaultIamRoleArn;
        }

        @Override
        public final java.util.List<java.lang.String> getIamRoles() {
            return this.iamRoles;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.util.List<java.lang.String> getLogExports() {
            return this.logExports;
        }

        @Override
        public final java.lang.Object getManageAdminPassword() {
            return this.manageAdminPassword;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("namespaceName", om.valueToTree(this.getNamespaceName()));
            if (this.getAdminPasswordSecretKmsKeyId() != null) {
                data.set("adminPasswordSecretKmsKeyId", om.valueToTree(this.getAdminPasswordSecretKmsKeyId()));
            }
            if (this.getAdminUsername() != null) {
                data.set("adminUsername", om.valueToTree(this.getAdminUsername()));
            }
            if (this.getAdminUserPassword() != null) {
                data.set("adminUserPassword", om.valueToTree(this.getAdminUserPassword()));
            }
            if (this.getAdminUserPasswordWo() != null) {
                data.set("adminUserPasswordWo", om.valueToTree(this.getAdminUserPasswordWo()));
            }
            if (this.getAdminUserPasswordWoVersion() != null) {
                data.set("adminUserPasswordWoVersion", om.valueToTree(this.getAdminUserPasswordWoVersion()));
            }
            if (this.getDbName() != null) {
                data.set("dbName", om.valueToTree(this.getDbName()));
            }
            if (this.getDefaultIamRoleArn() != null) {
                data.set("defaultIamRoleArn", om.valueToTree(this.getDefaultIamRoleArn()));
            }
            if (this.getIamRoles() != null) {
                data.set("iamRoles", om.valueToTree(this.getIamRoles()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLogExports() != null) {
                data.set("logExports", om.valueToTree(this.getLogExports()));
            }
            if (this.getManageAdminPassword() != null) {
                data.set("manageAdminPassword", om.valueToTree(this.getManageAdminPassword()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.redshiftserverlessNamespace.RedshiftserverlessNamespaceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftserverlessNamespaceConfig.Jsii$Proxy that = (RedshiftserverlessNamespaceConfig.Jsii$Proxy) o;

            if (!namespaceName.equals(that.namespaceName)) return false;
            if (this.adminPasswordSecretKmsKeyId != null ? !this.adminPasswordSecretKmsKeyId.equals(that.adminPasswordSecretKmsKeyId) : that.adminPasswordSecretKmsKeyId != null) return false;
            if (this.adminUsername != null ? !this.adminUsername.equals(that.adminUsername) : that.adminUsername != null) return false;
            if (this.adminUserPassword != null ? !this.adminUserPassword.equals(that.adminUserPassword) : that.adminUserPassword != null) return false;
            if (this.adminUserPasswordWo != null ? !this.adminUserPasswordWo.equals(that.adminUserPasswordWo) : that.adminUserPasswordWo != null) return false;
            if (this.adminUserPasswordWoVersion != null ? !this.adminUserPasswordWoVersion.equals(that.adminUserPasswordWoVersion) : that.adminUserPasswordWoVersion != null) return false;
            if (this.dbName != null ? !this.dbName.equals(that.dbName) : that.dbName != null) return false;
            if (this.defaultIamRoleArn != null ? !this.defaultIamRoleArn.equals(that.defaultIamRoleArn) : that.defaultIamRoleArn != null) return false;
            if (this.iamRoles != null ? !this.iamRoles.equals(that.iamRoles) : that.iamRoles != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.logExports != null ? !this.logExports.equals(that.logExports) : that.logExports != null) return false;
            if (this.manageAdminPassword != null ? !this.manageAdminPassword.equals(that.manageAdminPassword) : that.manageAdminPassword != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.namespaceName.hashCode();
            result = 31 * result + (this.adminPasswordSecretKmsKeyId != null ? this.adminPasswordSecretKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.adminUsername != null ? this.adminUsername.hashCode() : 0);
            result = 31 * result + (this.adminUserPassword != null ? this.adminUserPassword.hashCode() : 0);
            result = 31 * result + (this.adminUserPasswordWo != null ? this.adminUserPasswordWo.hashCode() : 0);
            result = 31 * result + (this.adminUserPasswordWoVersion != null ? this.adminUserPasswordWoVersion.hashCode() : 0);
            result = 31 * result + (this.dbName != null ? this.dbName.hashCode() : 0);
            result = 31 * result + (this.defaultIamRoleArn != null ? this.defaultIamRoleArn.hashCode() : 0);
            result = 31 * result + (this.iamRoles != null ? this.iamRoles.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.logExports != null ? this.logExports.hashCode() : 0);
            result = 31 * result + (this.manageAdminPassword != null ? this.manageAdminPassword.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
