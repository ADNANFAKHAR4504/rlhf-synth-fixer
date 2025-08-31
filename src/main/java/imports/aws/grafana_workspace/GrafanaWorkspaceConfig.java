package imports.aws.grafana_workspace;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.309Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.grafanaWorkspace.GrafanaWorkspaceConfig")
@software.amazon.jsii.Jsii.Proxy(GrafanaWorkspaceConfig.Jsii$Proxy.class)
public interface GrafanaWorkspaceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#account_access_type GrafanaWorkspace#account_access_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccountAccessType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#authentication_providers GrafanaWorkspace#authentication_providers}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAuthenticationProviders();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#permission_type GrafanaWorkspace#permission_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPermissionType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#configuration GrafanaWorkspace#configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#data_sources GrafanaWorkspace#data_sources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDataSources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#description GrafanaWorkspace#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#grafana_version GrafanaWorkspace#grafana_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGrafanaVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#id GrafanaWorkspace#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#name GrafanaWorkspace#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * network_access_control block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#network_access_control GrafanaWorkspace#network_access_control}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl getNetworkAccessControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#notification_destinations GrafanaWorkspace#notification_destinations}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotificationDestinations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#organizational_units GrafanaWorkspace#organizational_units}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOrganizationalUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#organization_role_name GrafanaWorkspace#organization_role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOrganizationRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#role_arn GrafanaWorkspace#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#stack_set_name GrafanaWorkspace#stack_set_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStackSetName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#tags GrafanaWorkspace#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#tags_all GrafanaWorkspace#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#timeouts GrafanaWorkspace#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.grafana_workspace.GrafanaWorkspaceTimeouts getTimeouts() {
        return null;
    }

    /**
     * vpc_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#vpc_configuration GrafanaWorkspace#vpc_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration getVpcConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GrafanaWorkspaceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GrafanaWorkspaceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GrafanaWorkspaceConfig> {
        java.lang.String accountAccessType;
        java.util.List<java.lang.String> authenticationProviders;
        java.lang.String permissionType;
        java.lang.String configuration;
        java.util.List<java.lang.String> dataSources;
        java.lang.String description;
        java.lang.String grafanaVersion;
        java.lang.String id;
        java.lang.String name;
        imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl networkAccessControl;
        java.util.List<java.lang.String> notificationDestinations;
        java.util.List<java.lang.String> organizationalUnits;
        java.lang.String organizationRoleName;
        java.lang.String roleArn;
        java.lang.String stackSetName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.grafana_workspace.GrafanaWorkspaceTimeouts timeouts;
        imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration vpcConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getAccountAccessType}
         * @param accountAccessType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#account_access_type GrafanaWorkspace#account_access_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountAccessType(java.lang.String accountAccessType) {
            this.accountAccessType = accountAccessType;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getAuthenticationProviders}
         * @param authenticationProviders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#authentication_providers GrafanaWorkspace#authentication_providers}. This parameter is required.
         * @return {@code this}
         */
        public Builder authenticationProviders(java.util.List<java.lang.String> authenticationProviders) {
            this.authenticationProviders = authenticationProviders;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getPermissionType}
         * @param permissionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#permission_type GrafanaWorkspace#permission_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder permissionType(java.lang.String permissionType) {
            this.permissionType = permissionType;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getConfiguration}
         * @param configuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#configuration GrafanaWorkspace#configuration}.
         * @return {@code this}
         */
        public Builder configuration(java.lang.String configuration) {
            this.configuration = configuration;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getDataSources}
         * @param dataSources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#data_sources GrafanaWorkspace#data_sources}.
         * @return {@code this}
         */
        public Builder dataSources(java.util.List<java.lang.String> dataSources) {
            this.dataSources = dataSources;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#description GrafanaWorkspace#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getGrafanaVersion}
         * @param grafanaVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#grafana_version GrafanaWorkspace#grafana_version}.
         * @return {@code this}
         */
        public Builder grafanaVersion(java.lang.String grafanaVersion) {
            this.grafanaVersion = grafanaVersion;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#id GrafanaWorkspace#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#name GrafanaWorkspace#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getNetworkAccessControl}
         * @param networkAccessControl network_access_control block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#network_access_control GrafanaWorkspace#network_access_control}
         * @return {@code this}
         */
        public Builder networkAccessControl(imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl networkAccessControl) {
            this.networkAccessControl = networkAccessControl;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getNotificationDestinations}
         * @param notificationDestinations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#notification_destinations GrafanaWorkspace#notification_destinations}.
         * @return {@code this}
         */
        public Builder notificationDestinations(java.util.List<java.lang.String> notificationDestinations) {
            this.notificationDestinations = notificationDestinations;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getOrganizationalUnits}
         * @param organizationalUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#organizational_units GrafanaWorkspace#organizational_units}.
         * @return {@code this}
         */
        public Builder organizationalUnits(java.util.List<java.lang.String> organizationalUnits) {
            this.organizationalUnits = organizationalUnits;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getOrganizationRoleName}
         * @param organizationRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#organization_role_name GrafanaWorkspace#organization_role_name}.
         * @return {@code this}
         */
        public Builder organizationRoleName(java.lang.String organizationRoleName) {
            this.organizationRoleName = organizationRoleName;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#role_arn GrafanaWorkspace#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getStackSetName}
         * @param stackSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#stack_set_name GrafanaWorkspace#stack_set_name}.
         * @return {@code this}
         */
        public Builder stackSetName(java.lang.String stackSetName) {
            this.stackSetName = stackSetName;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#tags GrafanaWorkspace#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#tags_all GrafanaWorkspace#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#timeouts GrafanaWorkspace#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.grafana_workspace.GrafanaWorkspaceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getVpcConfiguration}
         * @param vpcConfiguration vpc_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#vpc_configuration GrafanaWorkspace#vpc_configuration}
         * @return {@code this}
         */
        public Builder vpcConfiguration(imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration vpcConfiguration) {
            this.vpcConfiguration = vpcConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getDependsOn}
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
         * Sets the value of {@link GrafanaWorkspaceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceConfig#getProvisioners}
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
         * @return a new instance of {@link GrafanaWorkspaceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GrafanaWorkspaceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GrafanaWorkspaceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GrafanaWorkspaceConfig {
        private final java.lang.String accountAccessType;
        private final java.util.List<java.lang.String> authenticationProviders;
        private final java.lang.String permissionType;
        private final java.lang.String configuration;
        private final java.util.List<java.lang.String> dataSources;
        private final java.lang.String description;
        private final java.lang.String grafanaVersion;
        private final java.lang.String id;
        private final java.lang.String name;
        private final imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl networkAccessControl;
        private final java.util.List<java.lang.String> notificationDestinations;
        private final java.util.List<java.lang.String> organizationalUnits;
        private final java.lang.String organizationRoleName;
        private final java.lang.String roleArn;
        private final java.lang.String stackSetName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.grafana_workspace.GrafanaWorkspaceTimeouts timeouts;
        private final imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration vpcConfiguration;
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
            this.accountAccessType = software.amazon.jsii.Kernel.get(this, "accountAccessType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authenticationProviders = software.amazon.jsii.Kernel.get(this, "authenticationProviders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.permissionType = software.amazon.jsii.Kernel.get(this, "permissionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configuration = software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSources = software.amazon.jsii.Kernel.get(this, "dataSources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.grafanaVersion = software.amazon.jsii.Kernel.get(this, "grafanaVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkAccessControl = software.amazon.jsii.Kernel.get(this, "networkAccessControl", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl.class));
            this.notificationDestinations = software.amazon.jsii.Kernel.get(this, "notificationDestinations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.organizationalUnits = software.amazon.jsii.Kernel.get(this, "organizationalUnits", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.organizationRoleName = software.amazon.jsii.Kernel.get(this, "organizationRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stackSetName = software.amazon.jsii.Kernel.get(this, "stackSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceTimeouts.class));
            this.vpcConfiguration = software.amazon.jsii.Kernel.get(this, "vpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration.class));
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
            this.accountAccessType = java.util.Objects.requireNonNull(builder.accountAccessType, "accountAccessType is required");
            this.authenticationProviders = java.util.Objects.requireNonNull(builder.authenticationProviders, "authenticationProviders is required");
            this.permissionType = java.util.Objects.requireNonNull(builder.permissionType, "permissionType is required");
            this.configuration = builder.configuration;
            this.dataSources = builder.dataSources;
            this.description = builder.description;
            this.grafanaVersion = builder.grafanaVersion;
            this.id = builder.id;
            this.name = builder.name;
            this.networkAccessControl = builder.networkAccessControl;
            this.notificationDestinations = builder.notificationDestinations;
            this.organizationalUnits = builder.organizationalUnits;
            this.organizationRoleName = builder.organizationRoleName;
            this.roleArn = builder.roleArn;
            this.stackSetName = builder.stackSetName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.vpcConfiguration = builder.vpcConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAccountAccessType() {
            return this.accountAccessType;
        }

        @Override
        public final java.util.List<java.lang.String> getAuthenticationProviders() {
            return this.authenticationProviders;
        }

        @Override
        public final java.lang.String getPermissionType() {
            return this.permissionType;
        }

        @Override
        public final java.lang.String getConfiguration() {
            return this.configuration;
        }

        @Override
        public final java.util.List<java.lang.String> getDataSources() {
            return this.dataSources;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getGrafanaVersion() {
            return this.grafanaVersion;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl getNetworkAccessControl() {
            return this.networkAccessControl;
        }

        @Override
        public final java.util.List<java.lang.String> getNotificationDestinations() {
            return this.notificationDestinations;
        }

        @Override
        public final java.util.List<java.lang.String> getOrganizationalUnits() {
            return this.organizationalUnits;
        }

        @Override
        public final java.lang.String getOrganizationRoleName() {
            return this.organizationRoleName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getStackSetName() {
            return this.stackSetName;
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
        public final imports.aws.grafana_workspace.GrafanaWorkspaceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration getVpcConfiguration() {
            return this.vpcConfiguration;
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

            data.set("accountAccessType", om.valueToTree(this.getAccountAccessType()));
            data.set("authenticationProviders", om.valueToTree(this.getAuthenticationProviders()));
            data.set("permissionType", om.valueToTree(this.getPermissionType()));
            if (this.getConfiguration() != null) {
                data.set("configuration", om.valueToTree(this.getConfiguration()));
            }
            if (this.getDataSources() != null) {
                data.set("dataSources", om.valueToTree(this.getDataSources()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getGrafanaVersion() != null) {
                data.set("grafanaVersion", om.valueToTree(this.getGrafanaVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNetworkAccessControl() != null) {
                data.set("networkAccessControl", om.valueToTree(this.getNetworkAccessControl()));
            }
            if (this.getNotificationDestinations() != null) {
                data.set("notificationDestinations", om.valueToTree(this.getNotificationDestinations()));
            }
            if (this.getOrganizationalUnits() != null) {
                data.set("organizationalUnits", om.valueToTree(this.getOrganizationalUnits()));
            }
            if (this.getOrganizationRoleName() != null) {
                data.set("organizationRoleName", om.valueToTree(this.getOrganizationRoleName()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getStackSetName() != null) {
                data.set("stackSetName", om.valueToTree(this.getStackSetName()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVpcConfiguration() != null) {
                data.set("vpcConfiguration", om.valueToTree(this.getVpcConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.grafanaWorkspace.GrafanaWorkspaceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GrafanaWorkspaceConfig.Jsii$Proxy that = (GrafanaWorkspaceConfig.Jsii$Proxy) o;

            if (!accountAccessType.equals(that.accountAccessType)) return false;
            if (!authenticationProviders.equals(that.authenticationProviders)) return false;
            if (!permissionType.equals(that.permissionType)) return false;
            if (this.configuration != null ? !this.configuration.equals(that.configuration) : that.configuration != null) return false;
            if (this.dataSources != null ? !this.dataSources.equals(that.dataSources) : that.dataSources != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.grafanaVersion != null ? !this.grafanaVersion.equals(that.grafanaVersion) : that.grafanaVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.networkAccessControl != null ? !this.networkAccessControl.equals(that.networkAccessControl) : that.networkAccessControl != null) return false;
            if (this.notificationDestinations != null ? !this.notificationDestinations.equals(that.notificationDestinations) : that.notificationDestinations != null) return false;
            if (this.organizationalUnits != null ? !this.organizationalUnits.equals(that.organizationalUnits) : that.organizationalUnits != null) return false;
            if (this.organizationRoleName != null ? !this.organizationRoleName.equals(that.organizationRoleName) : that.organizationRoleName != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            if (this.stackSetName != null ? !this.stackSetName.equals(that.stackSetName) : that.stackSetName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcConfiguration != null ? !this.vpcConfiguration.equals(that.vpcConfiguration) : that.vpcConfiguration != null) return false;
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
            int result = this.accountAccessType.hashCode();
            result = 31 * result + (this.authenticationProviders.hashCode());
            result = 31 * result + (this.permissionType.hashCode());
            result = 31 * result + (this.configuration != null ? this.configuration.hashCode() : 0);
            result = 31 * result + (this.dataSources != null ? this.dataSources.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.grafanaVersion != null ? this.grafanaVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.networkAccessControl != null ? this.networkAccessControl.hashCode() : 0);
            result = 31 * result + (this.notificationDestinations != null ? this.notificationDestinations.hashCode() : 0);
            result = 31 * result + (this.organizationalUnits != null ? this.organizationalUnits.hashCode() : 0);
            result = 31 * result + (this.organizationRoleName != null ? this.organizationRoleName.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.stackSetName != null ? this.stackSetName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcConfiguration != null ? this.vpcConfiguration.hashCode() : 0);
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
