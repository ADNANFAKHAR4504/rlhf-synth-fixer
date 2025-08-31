package imports.aws.data_aws_lakeformation_permissions;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions aws_lakeformation_permissions}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.717Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLakeformationPermissions.DataAwsLakeformationPermissions")
public class DataAwsLakeformationPermissions extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsLakeformationPermissions(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsLakeformationPermissions(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissions.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions aws_lakeformation_permissions} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsLakeformationPermissions(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsLakeformationPermissions resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsLakeformationPermissions to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsLakeformationPermissions that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsLakeformationPermissions to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissions.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsLakeformationPermissions resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsLakeformationPermissions to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsLakeformationPermissions that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissions.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDatabase(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase value) {
        software.amazon.jsii.Kernel.call(this, "putDatabase", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDataCellsFilter(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter value) {
        software.amazon.jsii.Kernel.call(this, "putDataCellsFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDataLocation(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation value) {
        software.amazon.jsii.Kernel.call(this, "putDataLocation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLfTag(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag value) {
        software.amazon.jsii.Kernel.call(this, "putLfTag", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLfTagPolicy(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putLfTagPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTable(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable value) {
        software.amazon.jsii.Kernel.call(this, "putTable", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTableWithColumns(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns value) {
        software.amazon.jsii.Kernel.call(this, "putTableWithColumns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCatalogId() {
        software.amazon.jsii.Kernel.call(this, "resetCatalogId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCatalogResource() {
        software.amazon.jsii.Kernel.call(this, "resetCatalogResource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatabase() {
        software.amazon.jsii.Kernel.call(this, "resetDatabase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataCellsFilter() {
        software.amazon.jsii.Kernel.call(this, "resetDataCellsFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataLocation() {
        software.amazon.jsii.Kernel.call(this, "resetDataLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLfTag() {
        software.amazon.jsii.Kernel.call(this, "resetLfTag", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLfTagPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetLfTagPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTable() {
        software.amazon.jsii.Kernel.call(this, "resetTable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTableWithColumns() {
        software.amazon.jsii.Kernel.call(this, "resetTableWithColumns", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabaseOutputReference getDatabase() {
        return software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabaseOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilterOutputReference getDataCellsFilter() {
        return software.amazon.jsii.Kernel.get(this, "dataCellsFilter", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocationOutputReference getDataLocation() {
        return software.amazon.jsii.Kernel.get(this, "dataLocation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagOutputReference getLfTag() {
        return software.amazon.jsii.Kernel.get(this, "lfTag", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicyOutputReference getLfTagPolicy() {
        return software.amazon.jsii.Kernel.get(this, "lfTagPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPermissions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPermissionsWithGrantOption() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "permissionsWithGrantOption", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableOutputReference getTable() {
        return software.amazon.jsii.Kernel.get(this, "table", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumnsOutputReference getTableWithColumns() {
        return software.amazon.jsii.Kernel.get(this, "tableWithColumns", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumnsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCatalogIdInput() {
        return software.amazon.jsii.Kernel.get(this, "catalogIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCatalogResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "catalogResourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase getDatabaseInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter getDataCellsFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "dataCellsFilterInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation getDataLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "dataLocationInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag getLfTagInput() {
        return software.amazon.jsii.Kernel.get(this, "lfTagInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy getLfTagPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "lfTagPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "principalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable getTableInput() {
        return software.amazon.jsii.Kernel.get(this, "tableInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns getTableWithColumnsInput() {
        return software.amazon.jsii.Kernel.get(this, "tableWithColumnsInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCatalogId() {
        return software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCatalogId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "catalogId", java.util.Objects.requireNonNull(value, "catalogId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCatalogResource() {
        return software.amazon.jsii.Kernel.get(this, "catalogResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCatalogResource(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "catalogResource", java.util.Objects.requireNonNull(value, "catalogResource is required"));
    }

    public void setCatalogResource(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "catalogResource", java.util.Objects.requireNonNull(value, "catalogResource is required"));
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

    /**
     * A fluent builder for {@link imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissions}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissions> {
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
        private final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#principal DataAwsLakeformationPermissions#principal}.
         * <p>
         * @return {@code this}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#principal DataAwsLakeformationPermissions#principal}. This parameter is required.
         */
        public Builder principal(final java.lang.String principal) {
            this.config.principal(principal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_id DataAwsLakeformationPermissions#catalog_id}.
         * <p>
         * @return {@code this}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_id DataAwsLakeformationPermissions#catalog_id}. This parameter is required.
         */
        public Builder catalogId(final java.lang.String catalogId) {
            this.config.catalogId(catalogId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_resource DataAwsLakeformationPermissions#catalog_resource}.
         * <p>
         * @return {@code this}
         * @param catalogResource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_resource DataAwsLakeformationPermissions#catalog_resource}. This parameter is required.
         */
        public Builder catalogResource(final java.lang.Boolean catalogResource) {
            this.config.catalogResource(catalogResource);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_resource DataAwsLakeformationPermissions#catalog_resource}.
         * <p>
         * @return {@code this}
         * @param catalogResource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_resource DataAwsLakeformationPermissions#catalog_resource}. This parameter is required.
         */
        public Builder catalogResource(final com.hashicorp.cdktf.IResolvable catalogResource) {
            this.config.catalogResource(catalogResource);
            return this;
        }

        /**
         * database block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#database DataAwsLakeformationPermissions#database}
         * <p>
         * @return {@code this}
         * @param database database block. This parameter is required.
         */
        public Builder database(final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase database) {
            this.config.database(database);
            return this;
        }

        /**
         * data_cells_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#data_cells_filter DataAwsLakeformationPermissions#data_cells_filter}
         * <p>
         * @return {@code this}
         * @param dataCellsFilter data_cells_filter block. This parameter is required.
         */
        public Builder dataCellsFilter(final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter dataCellsFilter) {
            this.config.dataCellsFilter(dataCellsFilter);
            return this;
        }

        /**
         * data_location block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#data_location DataAwsLakeformationPermissions#data_location}
         * <p>
         * @return {@code this}
         * @param dataLocation data_location block. This parameter is required.
         */
        public Builder dataLocation(final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation dataLocation) {
            this.config.dataLocation(dataLocation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#id DataAwsLakeformationPermissions#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#id DataAwsLakeformationPermissions#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * lf_tag block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#lf_tag DataAwsLakeformationPermissions#lf_tag}
         * <p>
         * @return {@code this}
         * @param lfTag lf_tag block. This parameter is required.
         */
        public Builder lfTag(final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag lfTag) {
            this.config.lfTag(lfTag);
            return this;
        }

        /**
         * lf_tag_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#lf_tag_policy DataAwsLakeformationPermissions#lf_tag_policy}
         * <p>
         * @return {@code this}
         * @param lfTagPolicy lf_tag_policy block. This parameter is required.
         */
        public Builder lfTagPolicy(final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy lfTagPolicy) {
            this.config.lfTagPolicy(lfTagPolicy);
            return this;
        }

        /**
         * table block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table DataAwsLakeformationPermissions#table}
         * <p>
         * @return {@code this}
         * @param table table block. This parameter is required.
         */
        public Builder table(final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable table) {
            this.config.table(table);
            return this;
        }

        /**
         * table_with_columns block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table_with_columns DataAwsLakeformationPermissions#table_with_columns}
         * <p>
         * @return {@code this}
         * @param tableWithColumns table_with_columns block. This parameter is required.
         */
        public Builder tableWithColumns(final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns tableWithColumns) {
            this.config.tableWithColumns(tableWithColumns);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissions}.
         */
        @Override
        public imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissions build() {
            return new imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissions(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
