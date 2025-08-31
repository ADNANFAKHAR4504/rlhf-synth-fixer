package imports.aws.quicksight_dashboard;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard aws_quicksight_dashboard}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.098Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboard")
public class QuicksightDashboard extends com.hashicorp.cdktf.TerraformResource {

    protected QuicksightDashboard(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDashboard(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.quicksight_dashboard.QuicksightDashboard.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard aws_quicksight_dashboard} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public QuicksightDashboard(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a QuicksightDashboard resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightDashboard to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightDashboard that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the QuicksightDashboard to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_dashboard.QuicksightDashboard.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a QuicksightDashboard resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightDashboard to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightDashboard that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_dashboard.QuicksightDashboard.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDashboardPublishOptions(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions value) {
        software.amazon.jsii.Kernel.call(this, "putDashboardPublishOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putParameters(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardParameters value) {
        software.amazon.jsii.Kernel.call(this, "putParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPermissions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardPermissions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardPermissions> __cast_cd4240 = (java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardPermissions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_dashboard.QuicksightDashboardPermissions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPermissions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceEntity(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity value) {
        software.amazon.jsii.Kernel.call(this, "putSourceEntity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDashboardPublishOptions() {
        software.amazon.jsii.Kernel.call(this, "resetDashboardPublishOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefinition() {
        software.amazon.jsii.Kernel.call(this, "resetDefinition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetPermissions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceEntity() {
        software.amazon.jsii.Kernel.call(this, "resetSourceEntity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThemeArn() {
        software.amazon.jsii.Kernel.call(this, "resetThemeArn", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedTime() {
        return software.amazon.jsii.Kernel.get(this, "createdTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsOutputReference getDashboardPublishOptions() {
        return software.amazon.jsii.Kernel.get(this, "dashboardPublishOptions", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "definitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastPublishedTime() {
        return software.amazon.jsii.Kernel.get(this, "lastPublishedTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastUpdatedTime() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdatedTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardParametersOutputReference getParameters() {
        return software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardPermissionsList getPermissions() {
        return software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardPermissionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntityOutputReference getSourceEntity() {
        return software.amazon.jsii.Kernel.get(this, "sourceEntity", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntityOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceEntityArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceEntityArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVersionNumber() {
        return software.amazon.jsii.Kernel.get(this, "versionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDashboardIdInput() {
        return software.amazon.jsii.Kernel.get(this, "dashboardIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions getDashboardPublishOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "dashboardPublishOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardParameters getParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity getSourceEntityInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceEntityInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThemeArnInput() {
        return software.amazon.jsii.Kernel.get(this, "themeArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsAccountId", java.util.Objects.requireNonNull(value, "awsAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDashboardId() {
        return software.amazon.jsii.Kernel.get(this, "dashboardId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDashboardId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dashboardId", java.util.Objects.requireNonNull(value, "dashboardId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDefinition() {
        return software.amazon.jsii.Kernel.get(this, "definition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDefinition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        software.amazon.jsii.Kernel.set(this, "definition", java.util.Objects.requireNonNull(value, "definition is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getThemeArn() {
        return software.amazon.jsii.Kernel.get(this, "themeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThemeArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "themeArn", java.util.Objects.requireNonNull(value, "themeArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionDescription() {
        return software.amazon.jsii.Kernel.get(this, "versionDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersionDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "versionDescription", java.util.Objects.requireNonNull(value, "versionDescription is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.quicksight_dashboard.QuicksightDashboard}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.quicksight_dashboard.QuicksightDashboard> {
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
        private final imports.aws.quicksight_dashboard.QuicksightDashboardConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.quicksight_dashboard.QuicksightDashboardConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_id QuicksightDashboard#dashboard_id}.
         * <p>
         * @return {@code this}
         * @param dashboardId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_id QuicksightDashboard#dashboard_id}. This parameter is required.
         */
        public Builder dashboardId(final java.lang.String dashboardId) {
            this.config.dashboardId(dashboardId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#version_description QuicksightDashboard#version_description}.
         * <p>
         * @return {@code this}
         * @param versionDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#version_description QuicksightDashboard#version_description}. This parameter is required.
         */
        public Builder versionDescription(final java.lang.String versionDescription) {
            this.config.versionDescription(versionDescription);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#aws_account_id QuicksightDashboard#aws_account_id}.
         * <p>
         * @return {@code this}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#aws_account_id QuicksightDashboard#aws_account_id}. This parameter is required.
         */
        public Builder awsAccountId(final java.lang.String awsAccountId) {
            this.config.awsAccountId(awsAccountId);
            return this;
        }

        /**
         * dashboard_publish_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_publish_options QuicksightDashboard#dashboard_publish_options}
         * <p>
         * @return {@code this}
         * @param dashboardPublishOptions dashboard_publish_options block. This parameter is required.
         */
        public Builder dashboardPublishOptions(final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions dashboardPublishOptions) {
            this.config.dashboardPublishOptions(dashboardPublishOptions);
            return this;
        }

        /**
         * definition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#definition QuicksightDashboard#definition}
         * <p>
         * @return {@code this}
         * @param definition definition block. This parameter is required.
         */
        public Builder definition(final java.lang.Object definition) {
            this.config.definition(definition);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#id QuicksightDashboard#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#id QuicksightDashboard#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#parameters QuicksightDashboard#parameters}
         * <p>
         * @return {@code this}
         * @param parameters parameters block. This parameter is required.
         */
        public Builder parameters(final imports.aws.quicksight_dashboard.QuicksightDashboardParameters parameters) {
            this.config.parameters(parameters);
            return this;
        }

        /**
         * permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#permissions QuicksightDashboard#permissions}
         * <p>
         * @return {@code this}
         * @param permissions permissions block. This parameter is required.
         */
        public Builder permissions(final com.hashicorp.cdktf.IResolvable permissions) {
            this.config.permissions(permissions);
            return this;
        }
        /**
         * permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#permissions QuicksightDashboard#permissions}
         * <p>
         * @return {@code this}
         * @param permissions permissions block. This parameter is required.
         */
        public Builder permissions(final java.util.List<? extends imports.aws.quicksight_dashboard.QuicksightDashboardPermissions> permissions) {
            this.config.permissions(permissions);
            return this;
        }

        /**
         * source_entity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_entity QuicksightDashboard#source_entity}
         * <p>
         * @return {@code this}
         * @param sourceEntity source_entity block. This parameter is required.
         */
        public Builder sourceEntity(final imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity sourceEntity) {
            this.config.sourceEntity(sourceEntity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags QuicksightDashboard#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags QuicksightDashboard#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags_all QuicksightDashboard#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags_all QuicksightDashboard#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#theme_arn QuicksightDashboard#theme_arn}.
         * <p>
         * @return {@code this}
         * @param themeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#theme_arn QuicksightDashboard#theme_arn}. This parameter is required.
         */
        public Builder themeArn(final java.lang.String themeArn) {
            this.config.themeArn(themeArn);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#timeouts QuicksightDashboard#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.quicksight_dashboard.QuicksightDashboardTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.quicksight_dashboard.QuicksightDashboard}.
         */
        @Override
        public imports.aws.quicksight_dashboard.QuicksightDashboard build() {
            return new imports.aws.quicksight_dashboard.QuicksightDashboard(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
