package imports.aws.emr_studio;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.206Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrStudio.EmrStudioConfig")
@software.amazon.jsii.Jsii.Proxy(EmrStudioConfig.Jsii$Proxy.class)
public interface EmrStudioConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#auth_mode EmrStudio#auth_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthMode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#default_s3_location EmrStudio#default_s3_location}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefaultS3Location();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#engine_security_group_id EmrStudio#engine_security_group_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngineSecurityGroupId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#name EmrStudio#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#service_role EmrStudio#service_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#subnet_ids EmrStudio#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#vpc_id EmrStudio#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#workspace_security_group_id EmrStudio#workspace_security_group_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceSecurityGroupId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#description EmrStudio#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#encryption_key_arn EmrStudio#encryption_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#id EmrStudio#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#idp_auth_url EmrStudio#idp_auth_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdpAuthUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#idp_relay_state_parameter_name EmrStudio#idp_relay_state_parameter_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdpRelayStateParameterName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#tags EmrStudio#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#tags_all EmrStudio#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#user_role EmrStudio#user_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserRole() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrStudioConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrStudioConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrStudioConfig> {
        java.lang.String authMode;
        java.lang.String defaultS3Location;
        java.lang.String engineSecurityGroupId;
        java.lang.String name;
        java.lang.String serviceRole;
        java.util.List<java.lang.String> subnetIds;
        java.lang.String vpcId;
        java.lang.String workspaceSecurityGroupId;
        java.lang.String description;
        java.lang.String encryptionKeyArn;
        java.lang.String id;
        java.lang.String idpAuthUrl;
        java.lang.String idpRelayStateParameterName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String userRole;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EmrStudioConfig#getAuthMode}
         * @param authMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#auth_mode EmrStudio#auth_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder authMode(java.lang.String authMode) {
            this.authMode = authMode;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getDefaultS3Location}
         * @param defaultS3Location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#default_s3_location EmrStudio#default_s3_location}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultS3Location(java.lang.String defaultS3Location) {
            this.defaultS3Location = defaultS3Location;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getEngineSecurityGroupId}
         * @param engineSecurityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#engine_security_group_id EmrStudio#engine_security_group_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder engineSecurityGroupId(java.lang.String engineSecurityGroupId) {
            this.engineSecurityGroupId = engineSecurityGroupId;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#name EmrStudio#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getServiceRole}
         * @param serviceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#service_role EmrStudio#service_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceRole(java.lang.String serviceRole) {
            this.serviceRole = serviceRole;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#subnet_ids EmrStudio#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#vpc_id EmrStudio#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getWorkspaceSecurityGroupId}
         * @param workspaceSecurityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#workspace_security_group_id EmrStudio#workspace_security_group_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder workspaceSecurityGroupId(java.lang.String workspaceSecurityGroupId) {
            this.workspaceSecurityGroupId = workspaceSecurityGroupId;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#description EmrStudio#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getEncryptionKeyArn}
         * @param encryptionKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#encryption_key_arn EmrStudio#encryption_key_arn}.
         * @return {@code this}
         */
        public Builder encryptionKeyArn(java.lang.String encryptionKeyArn) {
            this.encryptionKeyArn = encryptionKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#id EmrStudio#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getIdpAuthUrl}
         * @param idpAuthUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#idp_auth_url EmrStudio#idp_auth_url}.
         * @return {@code this}
         */
        public Builder idpAuthUrl(java.lang.String idpAuthUrl) {
            this.idpAuthUrl = idpAuthUrl;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getIdpRelayStateParameterName}
         * @param idpRelayStateParameterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#idp_relay_state_parameter_name EmrStudio#idp_relay_state_parameter_name}.
         * @return {@code this}
         */
        public Builder idpRelayStateParameterName(java.lang.String idpRelayStateParameterName) {
            this.idpRelayStateParameterName = idpRelayStateParameterName;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#tags EmrStudio#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#tags_all EmrStudio#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getUserRole}
         * @param userRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio#user_role EmrStudio#user_role}.
         * @return {@code this}
         */
        public Builder userRole(java.lang.String userRole) {
            this.userRole = userRole;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getDependsOn}
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
         * Sets the value of {@link EmrStudioConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EmrStudioConfig#getProvisioners}
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
         * @return a new instance of {@link EmrStudioConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrStudioConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrStudioConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrStudioConfig {
        private final java.lang.String authMode;
        private final java.lang.String defaultS3Location;
        private final java.lang.String engineSecurityGroupId;
        private final java.lang.String name;
        private final java.lang.String serviceRole;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String vpcId;
        private final java.lang.String workspaceSecurityGroupId;
        private final java.lang.String description;
        private final java.lang.String encryptionKeyArn;
        private final java.lang.String id;
        private final java.lang.String idpAuthUrl;
        private final java.lang.String idpRelayStateParameterName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String userRole;
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
            this.authMode = software.amazon.jsii.Kernel.get(this, "authMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultS3Location = software.amazon.jsii.Kernel.get(this, "defaultS3Location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineSecurityGroupId = software.amazon.jsii.Kernel.get(this, "engineSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceRole = software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workspaceSecurityGroupId = software.amazon.jsii.Kernel.get(this, "workspaceSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionKeyArn = software.amazon.jsii.Kernel.get(this, "encryptionKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.idpAuthUrl = software.amazon.jsii.Kernel.get(this, "idpAuthUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.idpRelayStateParameterName = software.amazon.jsii.Kernel.get(this, "idpRelayStateParameterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.userRole = software.amazon.jsii.Kernel.get(this, "userRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.authMode = java.util.Objects.requireNonNull(builder.authMode, "authMode is required");
            this.defaultS3Location = java.util.Objects.requireNonNull(builder.defaultS3Location, "defaultS3Location is required");
            this.engineSecurityGroupId = java.util.Objects.requireNonNull(builder.engineSecurityGroupId, "engineSecurityGroupId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.serviceRole = java.util.Objects.requireNonNull(builder.serviceRole, "serviceRole is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
            this.workspaceSecurityGroupId = java.util.Objects.requireNonNull(builder.workspaceSecurityGroupId, "workspaceSecurityGroupId is required");
            this.description = builder.description;
            this.encryptionKeyArn = builder.encryptionKeyArn;
            this.id = builder.id;
            this.idpAuthUrl = builder.idpAuthUrl;
            this.idpRelayStateParameterName = builder.idpRelayStateParameterName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.userRole = builder.userRole;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAuthMode() {
            return this.authMode;
        }

        @Override
        public final java.lang.String getDefaultS3Location() {
            return this.defaultS3Location;
        }

        @Override
        public final java.lang.String getEngineSecurityGroupId() {
            return this.engineSecurityGroupId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getServiceRole() {
            return this.serviceRole;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.String getWorkspaceSecurityGroupId() {
            return this.workspaceSecurityGroupId;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getEncryptionKeyArn() {
            return this.encryptionKeyArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIdpAuthUrl() {
            return this.idpAuthUrl;
        }

        @Override
        public final java.lang.String getIdpRelayStateParameterName() {
            return this.idpRelayStateParameterName;
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
        public final java.lang.String getUserRole() {
            return this.userRole;
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

            data.set("authMode", om.valueToTree(this.getAuthMode()));
            data.set("defaultS3Location", om.valueToTree(this.getDefaultS3Location()));
            data.set("engineSecurityGroupId", om.valueToTree(this.getEngineSecurityGroupId()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("serviceRole", om.valueToTree(this.getServiceRole()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));
            data.set("workspaceSecurityGroupId", om.valueToTree(this.getWorkspaceSecurityGroupId()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEncryptionKeyArn() != null) {
                data.set("encryptionKeyArn", om.valueToTree(this.getEncryptionKeyArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdpAuthUrl() != null) {
                data.set("idpAuthUrl", om.valueToTree(this.getIdpAuthUrl()));
            }
            if (this.getIdpRelayStateParameterName() != null) {
                data.set("idpRelayStateParameterName", om.valueToTree(this.getIdpRelayStateParameterName()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getUserRole() != null) {
                data.set("userRole", om.valueToTree(this.getUserRole()));
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
            struct.set("fqn", om.valueToTree("aws.emrStudio.EmrStudioConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrStudioConfig.Jsii$Proxy that = (EmrStudioConfig.Jsii$Proxy) o;

            if (!authMode.equals(that.authMode)) return false;
            if (!defaultS3Location.equals(that.defaultS3Location)) return false;
            if (!engineSecurityGroupId.equals(that.engineSecurityGroupId)) return false;
            if (!name.equals(that.name)) return false;
            if (!serviceRole.equals(that.serviceRole)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            if (!vpcId.equals(that.vpcId)) return false;
            if (!workspaceSecurityGroupId.equals(that.workspaceSecurityGroupId)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.encryptionKeyArn != null ? !this.encryptionKeyArn.equals(that.encryptionKeyArn) : that.encryptionKeyArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.idpAuthUrl != null ? !this.idpAuthUrl.equals(that.idpAuthUrl) : that.idpAuthUrl != null) return false;
            if (this.idpRelayStateParameterName != null ? !this.idpRelayStateParameterName.equals(that.idpRelayStateParameterName) : that.idpRelayStateParameterName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.userRole != null ? !this.userRole.equals(that.userRole) : that.userRole != null) return false;
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
            int result = this.authMode.hashCode();
            result = 31 * result + (this.defaultS3Location.hashCode());
            result = 31 * result + (this.engineSecurityGroupId.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.serviceRole.hashCode());
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.vpcId.hashCode());
            result = 31 * result + (this.workspaceSecurityGroupId.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.encryptionKeyArn != null ? this.encryptionKeyArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.idpAuthUrl != null ? this.idpAuthUrl.hashCode() : 0);
            result = 31 * result + (this.idpRelayStateParameterName != null ? this.idpRelayStateParameterName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.userRole != null ? this.userRole.hashCode() : 0);
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
