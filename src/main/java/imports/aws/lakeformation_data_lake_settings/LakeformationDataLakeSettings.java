package imports.aws.lakeformation_data_lake_settings;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings aws_lakeformation_data_lake_settings}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.484Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationDataLakeSettings.LakeformationDataLakeSettings")
public class LakeformationDataLakeSettings extends com.hashicorp.cdktf.TerraformResource {

    protected LakeformationDataLakeSettings(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LakeformationDataLakeSettings(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettings.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings aws_lakeformation_data_lake_settings} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public LakeformationDataLakeSettings(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings aws_lakeformation_data_lake_settings} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public LakeformationDataLakeSettings(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a LakeformationDataLakeSettings resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LakeformationDataLakeSettings to import. This parameter is required.
     * @param importFromId The id of the existing LakeformationDataLakeSettings that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LakeformationDataLakeSettings to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettings.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LakeformationDataLakeSettings resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LakeformationDataLakeSettings to import. This parameter is required.
     * @param importFromId The id of the existing LakeformationDataLakeSettings that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettings.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCreateDatabaseDefaultPermissions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateDatabaseDefaultPermissions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateDatabaseDefaultPermissions> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateDatabaseDefaultPermissions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateDatabaseDefaultPermissions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCreateDatabaseDefaultPermissions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCreateTableDefaultPermissions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateTableDefaultPermissions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateTableDefaultPermissions> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateTableDefaultPermissions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateTableDefaultPermissions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCreateTableDefaultPermissions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdmins() {
        software.amazon.jsii.Kernel.call(this, "resetAdmins", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowExternalDataFiltering() {
        software.amazon.jsii.Kernel.call(this, "resetAllowExternalDataFiltering", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowFullTableExternalDataAccess() {
        software.amazon.jsii.Kernel.call(this, "resetAllowFullTableExternalDataAccess", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthorizedSessionTagValueList() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizedSessionTagValueList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCatalogId() {
        software.amazon.jsii.Kernel.call(this, "resetCatalogId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreateDatabaseDefaultPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetCreateDatabaseDefaultPermissions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreateTableDefaultPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetCreateTableDefaultPermissions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExternalDataFilteringAllowList() {
        software.amazon.jsii.Kernel.call(this, "resetExternalDataFilteringAllowList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadOnlyAdmins() {
        software.amazon.jsii.Kernel.call(this, "resetReadOnlyAdmins", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrustedResourceOwners() {
        software.amazon.jsii.Kernel.call(this, "resetTrustedResourceOwners", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateDatabaseDefaultPermissionsList getCreateDatabaseDefaultPermissions() {
        return software.amazon.jsii.Kernel.get(this, "createDatabaseDefaultPermissions", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateDatabaseDefaultPermissionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateTableDefaultPermissionsList getCreateTableDefaultPermissions() {
        return software.amazon.jsii.Kernel.get(this, "createTableDefaultPermissions", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateTableDefaultPermissionsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdminsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "adminsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowExternalDataFilteringInput() {
        return software.amazon.jsii.Kernel.get(this, "allowExternalDataFilteringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowFullTableExternalDataAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "allowFullTableExternalDataAccessInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAuthorizedSessionTagValueListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "authorizedSessionTagValueListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCatalogIdInput() {
        return software.amazon.jsii.Kernel.get(this, "catalogIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCreateDatabaseDefaultPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "createDatabaseDefaultPermissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCreateTableDefaultPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "createTableDefaultPermissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExternalDataFilteringAllowListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "externalDataFilteringAllowListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReadOnlyAdminsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "readOnlyAdminsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTrustedResourceOwnersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "trustedResourceOwnersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdmins() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "admins", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdmins(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "admins", java.util.Objects.requireNonNull(value, "admins is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowExternalDataFiltering() {
        return software.amazon.jsii.Kernel.get(this, "allowExternalDataFiltering", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowExternalDataFiltering(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowExternalDataFiltering", java.util.Objects.requireNonNull(value, "allowExternalDataFiltering is required"));
    }

    public void setAllowExternalDataFiltering(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowExternalDataFiltering", java.util.Objects.requireNonNull(value, "allowExternalDataFiltering is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowFullTableExternalDataAccess() {
        return software.amazon.jsii.Kernel.get(this, "allowFullTableExternalDataAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowFullTableExternalDataAccess(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowFullTableExternalDataAccess", java.util.Objects.requireNonNull(value, "allowFullTableExternalDataAccess is required"));
    }

    public void setAllowFullTableExternalDataAccess(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowFullTableExternalDataAccess", java.util.Objects.requireNonNull(value, "allowFullTableExternalDataAccess is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAuthorizedSessionTagValueList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "authorizedSessionTagValueList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAuthorizedSessionTagValueList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "authorizedSessionTagValueList", java.util.Objects.requireNonNull(value, "authorizedSessionTagValueList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCatalogId() {
        return software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCatalogId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "catalogId", java.util.Objects.requireNonNull(value, "catalogId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExternalDataFilteringAllowList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "externalDataFilteringAllowList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExternalDataFilteringAllowList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "externalDataFilteringAllowList", java.util.Objects.requireNonNull(value, "externalDataFilteringAllowList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getReadOnlyAdmins() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "readOnlyAdmins", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setReadOnlyAdmins(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "readOnlyAdmins", java.util.Objects.requireNonNull(value, "readOnlyAdmins is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTrustedResourceOwners() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "trustedResourceOwners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTrustedResourceOwners(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "trustedResourceOwners", java.util.Objects.requireNonNull(value, "trustedResourceOwners is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettings}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettings> {
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
        private imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#admins LakeformationDataLakeSettings#admins}.
         * <p>
         * @return {@code this}
         * @param admins Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#admins LakeformationDataLakeSettings#admins}. This parameter is required.
         */
        public Builder admins(final java.util.List<java.lang.String> admins) {
            this.config().admins(admins);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_external_data_filtering LakeformationDataLakeSettings#allow_external_data_filtering}.
         * <p>
         * @return {@code this}
         * @param allowExternalDataFiltering Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_external_data_filtering LakeformationDataLakeSettings#allow_external_data_filtering}. This parameter is required.
         */
        public Builder allowExternalDataFiltering(final java.lang.Boolean allowExternalDataFiltering) {
            this.config().allowExternalDataFiltering(allowExternalDataFiltering);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_external_data_filtering LakeformationDataLakeSettings#allow_external_data_filtering}.
         * <p>
         * @return {@code this}
         * @param allowExternalDataFiltering Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_external_data_filtering LakeformationDataLakeSettings#allow_external_data_filtering}. This parameter is required.
         */
        public Builder allowExternalDataFiltering(final com.hashicorp.cdktf.IResolvable allowExternalDataFiltering) {
            this.config().allowExternalDataFiltering(allowExternalDataFiltering);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_full_table_external_data_access LakeformationDataLakeSettings#allow_full_table_external_data_access}.
         * <p>
         * @return {@code this}
         * @param allowFullTableExternalDataAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_full_table_external_data_access LakeformationDataLakeSettings#allow_full_table_external_data_access}. This parameter is required.
         */
        public Builder allowFullTableExternalDataAccess(final java.lang.Boolean allowFullTableExternalDataAccess) {
            this.config().allowFullTableExternalDataAccess(allowFullTableExternalDataAccess);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_full_table_external_data_access LakeformationDataLakeSettings#allow_full_table_external_data_access}.
         * <p>
         * @return {@code this}
         * @param allowFullTableExternalDataAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_full_table_external_data_access LakeformationDataLakeSettings#allow_full_table_external_data_access}. This parameter is required.
         */
        public Builder allowFullTableExternalDataAccess(final com.hashicorp.cdktf.IResolvable allowFullTableExternalDataAccess) {
            this.config().allowFullTableExternalDataAccess(allowFullTableExternalDataAccess);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#authorized_session_tag_value_list LakeformationDataLakeSettings#authorized_session_tag_value_list}.
         * <p>
         * @return {@code this}
         * @param authorizedSessionTagValueList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#authorized_session_tag_value_list LakeformationDataLakeSettings#authorized_session_tag_value_list}. This parameter is required.
         */
        public Builder authorizedSessionTagValueList(final java.util.List<java.lang.String> authorizedSessionTagValueList) {
            this.config().authorizedSessionTagValueList(authorizedSessionTagValueList);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#catalog_id LakeformationDataLakeSettings#catalog_id}.
         * <p>
         * @return {@code this}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#catalog_id LakeformationDataLakeSettings#catalog_id}. This parameter is required.
         */
        public Builder catalogId(final java.lang.String catalogId) {
            this.config().catalogId(catalogId);
            return this;
        }

        /**
         * create_database_default_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_database_default_permissions LakeformationDataLakeSettings#create_database_default_permissions}
         * <p>
         * @return {@code this}
         * @param createDatabaseDefaultPermissions create_database_default_permissions block. This parameter is required.
         */
        public Builder createDatabaseDefaultPermissions(final com.hashicorp.cdktf.IResolvable createDatabaseDefaultPermissions) {
            this.config().createDatabaseDefaultPermissions(createDatabaseDefaultPermissions);
            return this;
        }
        /**
         * create_database_default_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_database_default_permissions LakeformationDataLakeSettings#create_database_default_permissions}
         * <p>
         * @return {@code this}
         * @param createDatabaseDefaultPermissions create_database_default_permissions block. This parameter is required.
         */
        public Builder createDatabaseDefaultPermissions(final java.util.List<? extends imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateDatabaseDefaultPermissions> createDatabaseDefaultPermissions) {
            this.config().createDatabaseDefaultPermissions(createDatabaseDefaultPermissions);
            return this;
        }

        /**
         * create_table_default_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_table_default_permissions LakeformationDataLakeSettings#create_table_default_permissions}
         * <p>
         * @return {@code this}
         * @param createTableDefaultPermissions create_table_default_permissions block. This parameter is required.
         */
        public Builder createTableDefaultPermissions(final com.hashicorp.cdktf.IResolvable createTableDefaultPermissions) {
            this.config().createTableDefaultPermissions(createTableDefaultPermissions);
            return this;
        }
        /**
         * create_table_default_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_table_default_permissions LakeformationDataLakeSettings#create_table_default_permissions}
         * <p>
         * @return {@code this}
         * @param createTableDefaultPermissions create_table_default_permissions block. This parameter is required.
         */
        public Builder createTableDefaultPermissions(final java.util.List<? extends imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateTableDefaultPermissions> createTableDefaultPermissions) {
            this.config().createTableDefaultPermissions(createTableDefaultPermissions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#external_data_filtering_allow_list LakeformationDataLakeSettings#external_data_filtering_allow_list}.
         * <p>
         * @return {@code this}
         * @param externalDataFilteringAllowList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#external_data_filtering_allow_list LakeformationDataLakeSettings#external_data_filtering_allow_list}. This parameter is required.
         */
        public Builder externalDataFilteringAllowList(final java.util.List<java.lang.String> externalDataFilteringAllowList) {
            this.config().externalDataFilteringAllowList(externalDataFilteringAllowList);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#id LakeformationDataLakeSettings#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#id LakeformationDataLakeSettings#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#parameters LakeformationDataLakeSettings#parameters}.
         * <p>
         * @return {@code this}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#parameters LakeformationDataLakeSettings#parameters}. This parameter is required.
         */
        public Builder parameters(final java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.config().parameters(parameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#read_only_admins LakeformationDataLakeSettings#read_only_admins}.
         * <p>
         * @return {@code this}
         * @param readOnlyAdmins Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#read_only_admins LakeformationDataLakeSettings#read_only_admins}. This parameter is required.
         */
        public Builder readOnlyAdmins(final java.util.List<java.lang.String> readOnlyAdmins) {
            this.config().readOnlyAdmins(readOnlyAdmins);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#trusted_resource_owners LakeformationDataLakeSettings#trusted_resource_owners}.
         * <p>
         * @return {@code this}
         * @param trustedResourceOwners Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#trusted_resource_owners LakeformationDataLakeSettings#trusted_resource_owners}. This parameter is required.
         */
        public Builder trustedResourceOwners(final java.util.List<java.lang.String> trustedResourceOwners) {
            this.config().trustedResourceOwners(trustedResourceOwners);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettings}.
         */
        @Override
        public imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettings build() {
            return new imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettings(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsConfig.Builder();
            }
            return this.config;
        }
    }
}
