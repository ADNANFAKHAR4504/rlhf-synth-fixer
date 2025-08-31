package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.686Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectoryConfig")
@software.amazon.jsii.Jsii.Proxy(WorkspacesDirectoryConfig.Jsii$Proxy.class)
public interface WorkspacesDirectoryConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * active_directory_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#active_directory_config WorkspacesDirectory#active_directory_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig getActiveDirectoryConfig() {
        return null;
    }

    /**
     * certificate_based_auth_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_based_auth_properties WorkspacesDirectory#certificate_based_auth_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties getCertificateBasedAuthProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#directory_id WorkspacesDirectory#directory_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectoryId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#id WorkspacesDirectory#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#ip_group_ids WorkspacesDirectory#ip_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpGroupIds() {
        return null;
    }

    /**
     * saml_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#saml_properties WorkspacesDirectory#saml_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties getSamlProperties() {
        return null;
    }

    /**
     * self_service_permissions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#self_service_permissions WorkspacesDirectory#self_service_permissions}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions getSelfServicePermissions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#subnet_ids WorkspacesDirectory#subnet_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags WorkspacesDirectory#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags_all WorkspacesDirectory#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_identity_type WorkspacesDirectory#user_identity_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserIdentityType() {
        return null;
    }

    /**
     * workspace_access_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_access_properties WorkspacesDirectory#workspace_access_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties getWorkspaceAccessProperties() {
        return null;
    }

    /**
     * workspace_creation_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_creation_properties WorkspacesDirectory#workspace_creation_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties getWorkspaceCreationProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_description WorkspacesDirectory#workspace_directory_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkspaceDirectoryDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_name WorkspacesDirectory#workspace_directory_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkspaceDirectoryName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_type WorkspacesDirectory#workspace_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkspaceType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspacesDirectoryConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspacesDirectoryConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspacesDirectoryConfig> {
        imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig activeDirectoryConfig;
        imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties certificateBasedAuthProperties;
        java.lang.String directoryId;
        java.lang.String id;
        java.util.List<java.lang.String> ipGroupIds;
        imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties samlProperties;
        imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions selfServicePermissions;
        java.util.List<java.lang.String> subnetIds;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String userIdentityType;
        imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties workspaceAccessProperties;
        imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties workspaceCreationProperties;
        java.lang.String workspaceDirectoryDescription;
        java.lang.String workspaceDirectoryName;
        java.lang.String workspaceType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getActiveDirectoryConfig}
         * @param activeDirectoryConfig active_directory_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#active_directory_config WorkspacesDirectory#active_directory_config}
         * @return {@code this}
         */
        public Builder activeDirectoryConfig(imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig activeDirectoryConfig) {
            this.activeDirectoryConfig = activeDirectoryConfig;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getCertificateBasedAuthProperties}
         * @param certificateBasedAuthProperties certificate_based_auth_properties block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_based_auth_properties WorkspacesDirectory#certificate_based_auth_properties}
         * @return {@code this}
         */
        public Builder certificateBasedAuthProperties(imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties certificateBasedAuthProperties) {
            this.certificateBasedAuthProperties = certificateBasedAuthProperties;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getDirectoryId}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#directory_id WorkspacesDirectory#directory_id}.
         * @return {@code this}
         */
        public Builder directoryId(java.lang.String directoryId) {
            this.directoryId = directoryId;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#id WorkspacesDirectory#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getIpGroupIds}
         * @param ipGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#ip_group_ids WorkspacesDirectory#ip_group_ids}.
         * @return {@code this}
         */
        public Builder ipGroupIds(java.util.List<java.lang.String> ipGroupIds) {
            this.ipGroupIds = ipGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getSamlProperties}
         * @param samlProperties saml_properties block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#saml_properties WorkspacesDirectory#saml_properties}
         * @return {@code this}
         */
        public Builder samlProperties(imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties samlProperties) {
            this.samlProperties = samlProperties;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getSelfServicePermissions}
         * @param selfServicePermissions self_service_permissions block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#self_service_permissions WorkspacesDirectory#self_service_permissions}
         * @return {@code this}
         */
        public Builder selfServicePermissions(imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions selfServicePermissions) {
            this.selfServicePermissions = selfServicePermissions;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#subnet_ids WorkspacesDirectory#subnet_ids}.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags WorkspacesDirectory#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags_all WorkspacesDirectory#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getUserIdentityType}
         * @param userIdentityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_identity_type WorkspacesDirectory#user_identity_type}.
         * @return {@code this}
         */
        public Builder userIdentityType(java.lang.String userIdentityType) {
            this.userIdentityType = userIdentityType;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getWorkspaceAccessProperties}
         * @param workspaceAccessProperties workspace_access_properties block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_access_properties WorkspacesDirectory#workspace_access_properties}
         * @return {@code this}
         */
        public Builder workspaceAccessProperties(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties workspaceAccessProperties) {
            this.workspaceAccessProperties = workspaceAccessProperties;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getWorkspaceCreationProperties}
         * @param workspaceCreationProperties workspace_creation_properties block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_creation_properties WorkspacesDirectory#workspace_creation_properties}
         * @return {@code this}
         */
        public Builder workspaceCreationProperties(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties workspaceCreationProperties) {
            this.workspaceCreationProperties = workspaceCreationProperties;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getWorkspaceDirectoryDescription}
         * @param workspaceDirectoryDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_description WorkspacesDirectory#workspace_directory_description}.
         * @return {@code this}
         */
        public Builder workspaceDirectoryDescription(java.lang.String workspaceDirectoryDescription) {
            this.workspaceDirectoryDescription = workspaceDirectoryDescription;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getWorkspaceDirectoryName}
         * @param workspaceDirectoryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_name WorkspacesDirectory#workspace_directory_name}.
         * @return {@code this}
         */
        public Builder workspaceDirectoryName(java.lang.String workspaceDirectoryName) {
            this.workspaceDirectoryName = workspaceDirectoryName;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getWorkspaceType}
         * @param workspaceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_type WorkspacesDirectory#workspace_type}.
         * @return {@code this}
         */
        public Builder workspaceType(java.lang.String workspaceType) {
            this.workspaceType = workspaceType;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getDependsOn}
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
         * Sets the value of {@link WorkspacesDirectoryConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryConfig#getProvisioners}
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
         * @return a new instance of {@link WorkspacesDirectoryConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspacesDirectoryConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspacesDirectoryConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspacesDirectoryConfig {
        private final imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig activeDirectoryConfig;
        private final imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties certificateBasedAuthProperties;
        private final java.lang.String directoryId;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> ipGroupIds;
        private final imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties samlProperties;
        private final imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions selfServicePermissions;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String userIdentityType;
        private final imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties workspaceAccessProperties;
        private final imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties workspaceCreationProperties;
        private final java.lang.String workspaceDirectoryDescription;
        private final java.lang.String workspaceDirectoryName;
        private final java.lang.String workspaceType;
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
            this.activeDirectoryConfig = software.amazon.jsii.Kernel.get(this, "activeDirectoryConfig", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig.class));
            this.certificateBasedAuthProperties = software.amazon.jsii.Kernel.get(this, "certificateBasedAuthProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties.class));
            this.directoryId = software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipGroupIds = software.amazon.jsii.Kernel.get(this, "ipGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.samlProperties = software.amazon.jsii.Kernel.get(this, "samlProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties.class));
            this.selfServicePermissions = software.amazon.jsii.Kernel.get(this, "selfServicePermissions", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.userIdentityType = software.amazon.jsii.Kernel.get(this, "userIdentityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workspaceAccessProperties = software.amazon.jsii.Kernel.get(this, "workspaceAccessProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties.class));
            this.workspaceCreationProperties = software.amazon.jsii.Kernel.get(this, "workspaceCreationProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties.class));
            this.workspaceDirectoryDescription = software.amazon.jsii.Kernel.get(this, "workspaceDirectoryDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workspaceDirectoryName = software.amazon.jsii.Kernel.get(this, "workspaceDirectoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workspaceType = software.amazon.jsii.Kernel.get(this, "workspaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.activeDirectoryConfig = builder.activeDirectoryConfig;
            this.certificateBasedAuthProperties = builder.certificateBasedAuthProperties;
            this.directoryId = builder.directoryId;
            this.id = builder.id;
            this.ipGroupIds = builder.ipGroupIds;
            this.samlProperties = builder.samlProperties;
            this.selfServicePermissions = builder.selfServicePermissions;
            this.subnetIds = builder.subnetIds;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.userIdentityType = builder.userIdentityType;
            this.workspaceAccessProperties = builder.workspaceAccessProperties;
            this.workspaceCreationProperties = builder.workspaceCreationProperties;
            this.workspaceDirectoryDescription = builder.workspaceDirectoryDescription;
            this.workspaceDirectoryName = builder.workspaceDirectoryName;
            this.workspaceType = builder.workspaceType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig getActiveDirectoryConfig() {
            return this.activeDirectoryConfig;
        }

        @Override
        public final imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties getCertificateBasedAuthProperties() {
            return this.certificateBasedAuthProperties;
        }

        @Override
        public final java.lang.String getDirectoryId() {
            return this.directoryId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getIpGroupIds() {
            return this.ipGroupIds;
        }

        @Override
        public final imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties getSamlProperties() {
            return this.samlProperties;
        }

        @Override
        public final imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions getSelfServicePermissions() {
            return this.selfServicePermissions;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
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
        public final java.lang.String getUserIdentityType() {
            return this.userIdentityType;
        }

        @Override
        public final imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties getWorkspaceAccessProperties() {
            return this.workspaceAccessProperties;
        }

        @Override
        public final imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties getWorkspaceCreationProperties() {
            return this.workspaceCreationProperties;
        }

        @Override
        public final java.lang.String getWorkspaceDirectoryDescription() {
            return this.workspaceDirectoryDescription;
        }

        @Override
        public final java.lang.String getWorkspaceDirectoryName() {
            return this.workspaceDirectoryName;
        }

        @Override
        public final java.lang.String getWorkspaceType() {
            return this.workspaceType;
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

            if (this.getActiveDirectoryConfig() != null) {
                data.set("activeDirectoryConfig", om.valueToTree(this.getActiveDirectoryConfig()));
            }
            if (this.getCertificateBasedAuthProperties() != null) {
                data.set("certificateBasedAuthProperties", om.valueToTree(this.getCertificateBasedAuthProperties()));
            }
            if (this.getDirectoryId() != null) {
                data.set("directoryId", om.valueToTree(this.getDirectoryId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpGroupIds() != null) {
                data.set("ipGroupIds", om.valueToTree(this.getIpGroupIds()));
            }
            if (this.getSamlProperties() != null) {
                data.set("samlProperties", om.valueToTree(this.getSamlProperties()));
            }
            if (this.getSelfServicePermissions() != null) {
                data.set("selfServicePermissions", om.valueToTree(this.getSelfServicePermissions()));
            }
            if (this.getSubnetIds() != null) {
                data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getUserIdentityType() != null) {
                data.set("userIdentityType", om.valueToTree(this.getUserIdentityType()));
            }
            if (this.getWorkspaceAccessProperties() != null) {
                data.set("workspaceAccessProperties", om.valueToTree(this.getWorkspaceAccessProperties()));
            }
            if (this.getWorkspaceCreationProperties() != null) {
                data.set("workspaceCreationProperties", om.valueToTree(this.getWorkspaceCreationProperties()));
            }
            if (this.getWorkspaceDirectoryDescription() != null) {
                data.set("workspaceDirectoryDescription", om.valueToTree(this.getWorkspaceDirectoryDescription()));
            }
            if (this.getWorkspaceDirectoryName() != null) {
                data.set("workspaceDirectoryName", om.valueToTree(this.getWorkspaceDirectoryName()));
            }
            if (this.getWorkspaceType() != null) {
                data.set("workspaceType", om.valueToTree(this.getWorkspaceType()));
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
            struct.set("fqn", om.valueToTree("aws.workspacesDirectory.WorkspacesDirectoryConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspacesDirectoryConfig.Jsii$Proxy that = (WorkspacesDirectoryConfig.Jsii$Proxy) o;

            if (this.activeDirectoryConfig != null ? !this.activeDirectoryConfig.equals(that.activeDirectoryConfig) : that.activeDirectoryConfig != null) return false;
            if (this.certificateBasedAuthProperties != null ? !this.certificateBasedAuthProperties.equals(that.certificateBasedAuthProperties) : that.certificateBasedAuthProperties != null) return false;
            if (this.directoryId != null ? !this.directoryId.equals(that.directoryId) : that.directoryId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipGroupIds != null ? !this.ipGroupIds.equals(that.ipGroupIds) : that.ipGroupIds != null) return false;
            if (this.samlProperties != null ? !this.samlProperties.equals(that.samlProperties) : that.samlProperties != null) return false;
            if (this.selfServicePermissions != null ? !this.selfServicePermissions.equals(that.selfServicePermissions) : that.selfServicePermissions != null) return false;
            if (this.subnetIds != null ? !this.subnetIds.equals(that.subnetIds) : that.subnetIds != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.userIdentityType != null ? !this.userIdentityType.equals(that.userIdentityType) : that.userIdentityType != null) return false;
            if (this.workspaceAccessProperties != null ? !this.workspaceAccessProperties.equals(that.workspaceAccessProperties) : that.workspaceAccessProperties != null) return false;
            if (this.workspaceCreationProperties != null ? !this.workspaceCreationProperties.equals(that.workspaceCreationProperties) : that.workspaceCreationProperties != null) return false;
            if (this.workspaceDirectoryDescription != null ? !this.workspaceDirectoryDescription.equals(that.workspaceDirectoryDescription) : that.workspaceDirectoryDescription != null) return false;
            if (this.workspaceDirectoryName != null ? !this.workspaceDirectoryName.equals(that.workspaceDirectoryName) : that.workspaceDirectoryName != null) return false;
            if (this.workspaceType != null ? !this.workspaceType.equals(that.workspaceType) : that.workspaceType != null) return false;
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
            int result = this.activeDirectoryConfig != null ? this.activeDirectoryConfig.hashCode() : 0;
            result = 31 * result + (this.certificateBasedAuthProperties != null ? this.certificateBasedAuthProperties.hashCode() : 0);
            result = 31 * result + (this.directoryId != null ? this.directoryId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipGroupIds != null ? this.ipGroupIds.hashCode() : 0);
            result = 31 * result + (this.samlProperties != null ? this.samlProperties.hashCode() : 0);
            result = 31 * result + (this.selfServicePermissions != null ? this.selfServicePermissions.hashCode() : 0);
            result = 31 * result + (this.subnetIds != null ? this.subnetIds.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.userIdentityType != null ? this.userIdentityType.hashCode() : 0);
            result = 31 * result + (this.workspaceAccessProperties != null ? this.workspaceAccessProperties.hashCode() : 0);
            result = 31 * result + (this.workspaceCreationProperties != null ? this.workspaceCreationProperties.hashCode() : 0);
            result = 31 * result + (this.workspaceDirectoryDescription != null ? this.workspaceDirectoryDescription.hashCode() : 0);
            result = 31 * result + (this.workspaceDirectoryName != null ? this.workspaceDirectoryName.hashCode() : 0);
            result = 31 * result + (this.workspaceType != null ? this.workspaceType.hashCode() : 0);
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
