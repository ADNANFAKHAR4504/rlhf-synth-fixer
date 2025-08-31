package imports.aws.grafana_workspace;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace aws_grafana_workspace}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.308Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.grafanaWorkspace.GrafanaWorkspace")
public class GrafanaWorkspace extends com.hashicorp.cdktf.TerraformResource {

    protected GrafanaWorkspace(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GrafanaWorkspace(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.grafana_workspace.GrafanaWorkspace.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace aws_grafana_workspace} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public GrafanaWorkspace(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace.GrafanaWorkspaceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a GrafanaWorkspace resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GrafanaWorkspace to import. This parameter is required.
     * @param importFromId The id of the existing GrafanaWorkspace that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the GrafanaWorkspace to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.grafana_workspace.GrafanaWorkspace.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a GrafanaWorkspace resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GrafanaWorkspace to import. This parameter is required.
     * @param importFromId The id of the existing GrafanaWorkspace that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.grafana_workspace.GrafanaWorkspace.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putNetworkAccessControl(final @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkAccessControl", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace.GrafanaWorkspaceTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataSources() {
        software.amazon.jsii.Kernel.call(this, "resetDataSources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGrafanaVersion() {
        software.amazon.jsii.Kernel.call(this, "resetGrafanaVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkAccessControl() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkAccessControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationDestinations() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationDestinations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationalUnits() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationalUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationRoleName() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationRoleName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStackSetName() {
        software.amazon.jsii.Kernel.call(this, "resetStackSetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControlOutputReference getNetworkAccessControl() {
        return software.amazon.jsii.Kernel.get(this, "networkAccessControl", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControlOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSamlConfigurationStatus() {
        return software.amazon.jsii.Kernel.get(this, "samlConfigurationStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace.GrafanaWorkspaceTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfigurationOutputReference getVpcConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountAccessTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "accountAccessTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAuthenticationProvidersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "authenticationProvidersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDataSourcesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "dataSourcesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGrafanaVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "grafanaVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl getNetworkAccessControlInput() {
        return software.amazon.jsii.Kernel.get(this, "networkAccessControlInput", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotificationDestinationsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "notificationDestinationsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOrganizationalUnitsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "organizationalUnitsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrganizationRoleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "organizationRoleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPermissionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStackSetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "stackSetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration getVpcConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountAccessType() {
        return software.amazon.jsii.Kernel.get(this, "accountAccessType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountAccessType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountAccessType", java.util.Objects.requireNonNull(value, "accountAccessType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAuthenticationProviders() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "authenticationProviders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAuthenticationProviders(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "authenticationProviders", java.util.Objects.requireNonNull(value, "authenticationProviders is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfiguration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configuration", java.util.Objects.requireNonNull(value, "configuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDataSources() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "dataSources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDataSources(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "dataSources", java.util.Objects.requireNonNull(value, "dataSources is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGrafanaVersion() {
        return software.amazon.jsii.Kernel.get(this, "grafanaVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGrafanaVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "grafanaVersion", java.util.Objects.requireNonNull(value, "grafanaVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNotificationDestinations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "notificationDestinations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNotificationDestinations(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "notificationDestinations", java.util.Objects.requireNonNull(value, "notificationDestinations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOrganizationalUnits() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "organizationalUnits", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOrganizationalUnits(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "organizationalUnits", java.util.Objects.requireNonNull(value, "organizationalUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganizationRoleName() {
        return software.amazon.jsii.Kernel.get(this, "organizationRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrganizationRoleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "organizationRoleName", java.util.Objects.requireNonNull(value, "organizationRoleName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPermissionType() {
        return software.amazon.jsii.Kernel.get(this, "permissionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPermissionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "permissionType", java.util.Objects.requireNonNull(value, "permissionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackSetName() {
        return software.amazon.jsii.Kernel.get(this, "stackSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStackSetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stackSetName", java.util.Objects.requireNonNull(value, "stackSetName is required"));
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
     * A fluent builder for {@link imports.aws.grafana_workspace.GrafanaWorkspace}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.grafana_workspace.GrafanaWorkspace> {
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
        private final imports.aws.grafana_workspace.GrafanaWorkspaceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.grafana_workspace.GrafanaWorkspaceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#account_access_type GrafanaWorkspace#account_access_type}.
         * <p>
         * @return {@code this}
         * @param accountAccessType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#account_access_type GrafanaWorkspace#account_access_type}. This parameter is required.
         */
        public Builder accountAccessType(final java.lang.String accountAccessType) {
            this.config.accountAccessType(accountAccessType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#authentication_providers GrafanaWorkspace#authentication_providers}.
         * <p>
         * @return {@code this}
         * @param authenticationProviders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#authentication_providers GrafanaWorkspace#authentication_providers}. This parameter is required.
         */
        public Builder authenticationProviders(final java.util.List<java.lang.String> authenticationProviders) {
            this.config.authenticationProviders(authenticationProviders);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#permission_type GrafanaWorkspace#permission_type}.
         * <p>
         * @return {@code this}
         * @param permissionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#permission_type GrafanaWorkspace#permission_type}. This parameter is required.
         */
        public Builder permissionType(final java.lang.String permissionType) {
            this.config.permissionType(permissionType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#configuration GrafanaWorkspace#configuration}.
         * <p>
         * @return {@code this}
         * @param configuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#configuration GrafanaWorkspace#configuration}. This parameter is required.
         */
        public Builder configuration(final java.lang.String configuration) {
            this.config.configuration(configuration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#data_sources GrafanaWorkspace#data_sources}.
         * <p>
         * @return {@code this}
         * @param dataSources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#data_sources GrafanaWorkspace#data_sources}. This parameter is required.
         */
        public Builder dataSources(final java.util.List<java.lang.String> dataSources) {
            this.config.dataSources(dataSources);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#description GrafanaWorkspace#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#description GrafanaWorkspace#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#grafana_version GrafanaWorkspace#grafana_version}.
         * <p>
         * @return {@code this}
         * @param grafanaVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#grafana_version GrafanaWorkspace#grafana_version}. This parameter is required.
         */
        public Builder grafanaVersion(final java.lang.String grafanaVersion) {
            this.config.grafanaVersion(grafanaVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#id GrafanaWorkspace#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#id GrafanaWorkspace#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#name GrafanaWorkspace#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#name GrafanaWorkspace#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * network_access_control block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#network_access_control GrafanaWorkspace#network_access_control}
         * <p>
         * @return {@code this}
         * @param networkAccessControl network_access_control block. This parameter is required.
         */
        public Builder networkAccessControl(final imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl networkAccessControl) {
            this.config.networkAccessControl(networkAccessControl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#notification_destinations GrafanaWorkspace#notification_destinations}.
         * <p>
         * @return {@code this}
         * @param notificationDestinations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#notification_destinations GrafanaWorkspace#notification_destinations}. This parameter is required.
         */
        public Builder notificationDestinations(final java.util.List<java.lang.String> notificationDestinations) {
            this.config.notificationDestinations(notificationDestinations);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#organizational_units GrafanaWorkspace#organizational_units}.
         * <p>
         * @return {@code this}
         * @param organizationalUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#organizational_units GrafanaWorkspace#organizational_units}. This parameter is required.
         */
        public Builder organizationalUnits(final java.util.List<java.lang.String> organizationalUnits) {
            this.config.organizationalUnits(organizationalUnits);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#organization_role_name GrafanaWorkspace#organization_role_name}.
         * <p>
         * @return {@code this}
         * @param organizationRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#organization_role_name GrafanaWorkspace#organization_role_name}. This parameter is required.
         */
        public Builder organizationRoleName(final java.lang.String organizationRoleName) {
            this.config.organizationRoleName(organizationRoleName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#role_arn GrafanaWorkspace#role_arn}.
         * <p>
         * @return {@code this}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#role_arn GrafanaWorkspace#role_arn}. This parameter is required.
         */
        public Builder roleArn(final java.lang.String roleArn) {
            this.config.roleArn(roleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#stack_set_name GrafanaWorkspace#stack_set_name}.
         * <p>
         * @return {@code this}
         * @param stackSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#stack_set_name GrafanaWorkspace#stack_set_name}. This parameter is required.
         */
        public Builder stackSetName(final java.lang.String stackSetName) {
            this.config.stackSetName(stackSetName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#tags GrafanaWorkspace#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#tags GrafanaWorkspace#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#tags_all GrafanaWorkspace#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#tags_all GrafanaWorkspace#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#timeouts GrafanaWorkspace#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.grafana_workspace.GrafanaWorkspaceTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * vpc_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#vpc_configuration GrafanaWorkspace#vpc_configuration}
         * <p>
         * @return {@code this}
         * @param vpcConfiguration vpc_configuration block. This parameter is required.
         */
        public Builder vpcConfiguration(final imports.aws.grafana_workspace.GrafanaWorkspaceVpcConfiguration vpcConfiguration) {
            this.config.vpcConfiguration(vpcConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.grafana_workspace.GrafanaWorkspace}.
         */
        @Override
        public imports.aws.grafana_workspace.GrafanaWorkspace build() {
            return new imports.aws.grafana_workspace.GrafanaWorkspace(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
