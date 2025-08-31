package imports.aws.grafana_workspace_saml_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration aws_grafana_workspace_saml_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.314Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.grafanaWorkspaceSamlConfiguration.GrafanaWorkspaceSamlConfiguration")
public class GrafanaWorkspaceSamlConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected GrafanaWorkspaceSamlConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GrafanaWorkspaceSamlConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration aws_grafana_workspace_saml_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public GrafanaWorkspaceSamlConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a GrafanaWorkspaceSamlConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GrafanaWorkspaceSamlConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing GrafanaWorkspaceSamlConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the GrafanaWorkspaceSamlConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a GrafanaWorkspaceSamlConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GrafanaWorkspaceSamlConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing GrafanaWorkspaceSamlConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfigurationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdminRoleValues() {
        software.amazon.jsii.Kernel.call(this, "resetAdminRoleValues", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowedOrganizations() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedOrganizations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmailAssertion() {
        software.amazon.jsii.Kernel.call(this, "resetEmailAssertion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGroupsAssertion() {
        software.amazon.jsii.Kernel.call(this, "resetGroupsAssertion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdpMetadataUrl() {
        software.amazon.jsii.Kernel.call(this, "resetIdpMetadataUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdpMetadataXml() {
        software.amazon.jsii.Kernel.call(this, "resetIdpMetadataXml", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoginAssertion() {
        software.amazon.jsii.Kernel.call(this, "resetLoginAssertion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoginValidityDuration() {
        software.amazon.jsii.Kernel.call(this, "resetLoginValidityDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNameAssertion() {
        software.amazon.jsii.Kernel.call(this, "resetNameAssertion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrgAssertion() {
        software.amazon.jsii.Kernel.call(this, "resetOrgAssertion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoleAssertion() {
        software.amazon.jsii.Kernel.call(this, "resetRoleAssertion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfigurationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfigurationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdminRoleValuesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "adminRoleValuesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedOrganizationsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowedOrganizationsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEditorRoleValuesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "editorRoleValuesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailAssertionInput() {
        return software.amazon.jsii.Kernel.get(this, "emailAssertionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupsAssertionInput() {
        return software.amazon.jsii.Kernel.get(this, "groupsAssertionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdpMetadataUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "idpMetadataUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdpMetadataXmlInput() {
        return software.amazon.jsii.Kernel.get(this, "idpMetadataXmlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoginAssertionInput() {
        return software.amazon.jsii.Kernel.get(this, "loginAssertionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLoginValidityDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "loginValidityDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameAssertionInput() {
        return software.amazon.jsii.Kernel.get(this, "nameAssertionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrgAssertionInput() {
        return software.amazon.jsii.Kernel.get(this, "orgAssertionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleAssertionInput() {
        return software.amazon.jsii.Kernel.get(this, "roleAssertionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWorkspaceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdminRoleValues() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "adminRoleValues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdminRoleValues(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "adminRoleValues", java.util.Objects.requireNonNull(value, "adminRoleValues is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedOrganizations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowedOrganizations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowedOrganizations(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowedOrganizations", java.util.Objects.requireNonNull(value, "allowedOrganizations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEditorRoleValues() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "editorRoleValues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEditorRoleValues(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "editorRoleValues", java.util.Objects.requireNonNull(value, "editorRoleValues is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmailAssertion() {
        return software.amazon.jsii.Kernel.get(this, "emailAssertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmailAssertion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emailAssertion", java.util.Objects.requireNonNull(value, "emailAssertion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroupsAssertion() {
        return software.amazon.jsii.Kernel.get(this, "groupsAssertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroupsAssertion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "groupsAssertion", java.util.Objects.requireNonNull(value, "groupsAssertion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdpMetadataUrl() {
        return software.amazon.jsii.Kernel.get(this, "idpMetadataUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdpMetadataUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "idpMetadataUrl", java.util.Objects.requireNonNull(value, "idpMetadataUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdpMetadataXml() {
        return software.amazon.jsii.Kernel.get(this, "idpMetadataXml", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdpMetadataXml(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "idpMetadataXml", java.util.Objects.requireNonNull(value, "idpMetadataXml is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoginAssertion() {
        return software.amazon.jsii.Kernel.get(this, "loginAssertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoginAssertion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loginAssertion", java.util.Objects.requireNonNull(value, "loginAssertion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLoginValidityDuration() {
        return software.amazon.jsii.Kernel.get(this, "loginValidityDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLoginValidityDuration(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "loginValidityDuration", java.util.Objects.requireNonNull(value, "loginValidityDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNameAssertion() {
        return software.amazon.jsii.Kernel.get(this, "nameAssertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNameAssertion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nameAssertion", java.util.Objects.requireNonNull(value, "nameAssertion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrgAssertion() {
        return software.amazon.jsii.Kernel.get(this, "orgAssertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrgAssertion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "orgAssertion", java.util.Objects.requireNonNull(value, "orgAssertion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleAssertion() {
        return software.amazon.jsii.Kernel.get(this, "roleAssertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleAssertion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleAssertion", java.util.Objects.requireNonNull(value, "roleAssertion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceId() {
        return software.amazon.jsii.Kernel.get(this, "workspaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWorkspaceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "workspaceId", java.util.Objects.requireNonNull(value, "workspaceId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfiguration> {
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
        private final imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfigurationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#editor_role_values GrafanaWorkspaceSamlConfiguration#editor_role_values}.
         * <p>
         * @return {@code this}
         * @param editorRoleValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#editor_role_values GrafanaWorkspaceSamlConfiguration#editor_role_values}. This parameter is required.
         */
        public Builder editorRoleValues(final java.util.List<java.lang.String> editorRoleValues) {
            this.config.editorRoleValues(editorRoleValues);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#workspace_id GrafanaWorkspaceSamlConfiguration#workspace_id}.
         * <p>
         * @return {@code this}
         * @param workspaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#workspace_id GrafanaWorkspaceSamlConfiguration#workspace_id}. This parameter is required.
         */
        public Builder workspaceId(final java.lang.String workspaceId) {
            this.config.workspaceId(workspaceId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#admin_role_values GrafanaWorkspaceSamlConfiguration#admin_role_values}.
         * <p>
         * @return {@code this}
         * @param adminRoleValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#admin_role_values GrafanaWorkspaceSamlConfiguration#admin_role_values}. This parameter is required.
         */
        public Builder adminRoleValues(final java.util.List<java.lang.String> adminRoleValues) {
            this.config.adminRoleValues(adminRoleValues);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#allowed_organizations GrafanaWorkspaceSamlConfiguration#allowed_organizations}.
         * <p>
         * @return {@code this}
         * @param allowedOrganizations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#allowed_organizations GrafanaWorkspaceSamlConfiguration#allowed_organizations}. This parameter is required.
         */
        public Builder allowedOrganizations(final java.util.List<java.lang.String> allowedOrganizations) {
            this.config.allowedOrganizations(allowedOrganizations);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#email_assertion GrafanaWorkspaceSamlConfiguration#email_assertion}.
         * <p>
         * @return {@code this}
         * @param emailAssertion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#email_assertion GrafanaWorkspaceSamlConfiguration#email_assertion}. This parameter is required.
         */
        public Builder emailAssertion(final java.lang.String emailAssertion) {
            this.config.emailAssertion(emailAssertion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#groups_assertion GrafanaWorkspaceSamlConfiguration#groups_assertion}.
         * <p>
         * @return {@code this}
         * @param groupsAssertion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#groups_assertion GrafanaWorkspaceSamlConfiguration#groups_assertion}. This parameter is required.
         */
        public Builder groupsAssertion(final java.lang.String groupsAssertion) {
            this.config.groupsAssertion(groupsAssertion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#id GrafanaWorkspaceSamlConfiguration#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#id GrafanaWorkspaceSamlConfiguration#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#idp_metadata_url GrafanaWorkspaceSamlConfiguration#idp_metadata_url}.
         * <p>
         * @return {@code this}
         * @param idpMetadataUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#idp_metadata_url GrafanaWorkspaceSamlConfiguration#idp_metadata_url}. This parameter is required.
         */
        public Builder idpMetadataUrl(final java.lang.String idpMetadataUrl) {
            this.config.idpMetadataUrl(idpMetadataUrl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#idp_metadata_xml GrafanaWorkspaceSamlConfiguration#idp_metadata_xml}.
         * <p>
         * @return {@code this}
         * @param idpMetadataXml Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#idp_metadata_xml GrafanaWorkspaceSamlConfiguration#idp_metadata_xml}. This parameter is required.
         */
        public Builder idpMetadataXml(final java.lang.String idpMetadataXml) {
            this.config.idpMetadataXml(idpMetadataXml);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#login_assertion GrafanaWorkspaceSamlConfiguration#login_assertion}.
         * <p>
         * @return {@code this}
         * @param loginAssertion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#login_assertion GrafanaWorkspaceSamlConfiguration#login_assertion}. This parameter is required.
         */
        public Builder loginAssertion(final java.lang.String loginAssertion) {
            this.config.loginAssertion(loginAssertion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#login_validity_duration GrafanaWorkspaceSamlConfiguration#login_validity_duration}.
         * <p>
         * @return {@code this}
         * @param loginValidityDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#login_validity_duration GrafanaWorkspaceSamlConfiguration#login_validity_duration}. This parameter is required.
         */
        public Builder loginValidityDuration(final java.lang.Number loginValidityDuration) {
            this.config.loginValidityDuration(loginValidityDuration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#name_assertion GrafanaWorkspaceSamlConfiguration#name_assertion}.
         * <p>
         * @return {@code this}
         * @param nameAssertion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#name_assertion GrafanaWorkspaceSamlConfiguration#name_assertion}. This parameter is required.
         */
        public Builder nameAssertion(final java.lang.String nameAssertion) {
            this.config.nameAssertion(nameAssertion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#org_assertion GrafanaWorkspaceSamlConfiguration#org_assertion}.
         * <p>
         * @return {@code this}
         * @param orgAssertion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#org_assertion GrafanaWorkspaceSamlConfiguration#org_assertion}. This parameter is required.
         */
        public Builder orgAssertion(final java.lang.String orgAssertion) {
            this.config.orgAssertion(orgAssertion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#role_assertion GrafanaWorkspaceSamlConfiguration#role_assertion}.
         * <p>
         * @return {@code this}
         * @param roleAssertion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#role_assertion GrafanaWorkspaceSamlConfiguration#role_assertion}. This parameter is required.
         */
        public Builder roleAssertion(final java.lang.String roleAssertion) {
            this.config.roleAssertion(roleAssertion);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#timeouts GrafanaWorkspaceSamlConfiguration#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfigurationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfiguration}.
         */
        @Override
        public imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfiguration build() {
            return new imports.aws.grafana_workspace_saml_configuration.GrafanaWorkspaceSamlConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
