package imports.aws.lakeformation_permissions;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.493Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationPermissions.LakeformationPermissionsConfig")
@software.amazon.jsii.Jsii.Proxy(LakeformationPermissionsConfig.Jsii$Proxy.class)
public interface LakeformationPermissionsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#permissions LakeformationPermissions#permissions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPermissions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#principal LakeformationPermissions#principal}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrincipal();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#catalog_id LakeformationPermissions#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#catalog_resource LakeformationPermissions#catalog_resource}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCatalogResource() {
        return null;
    }

    /**
     * database block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#database LakeformationPermissions#database}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lakeformation_permissions.LakeformationPermissionsDatabase getDatabase() {
        return null;
    }

    /**
     * data_cells_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#data_cells_filter LakeformationPermissions#data_cells_filter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lakeformation_permissions.LakeformationPermissionsDataCellsFilter getDataCellsFilter() {
        return null;
    }

    /**
     * data_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#data_location LakeformationPermissions#data_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lakeformation_permissions.LakeformationPermissionsDataLocation getDataLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#id LakeformationPermissions#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * lf_tag block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#lf_tag LakeformationPermissions#lf_tag}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lakeformation_permissions.LakeformationPermissionsLfTag getLfTag() {
        return null;
    }

    /**
     * lf_tag_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#lf_tag_policy LakeformationPermissions#lf_tag_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lakeformation_permissions.LakeformationPermissionsLfTagPolicy getLfTagPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#permissions_with_grant_option LakeformationPermissions#permissions_with_grant_option}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPermissionsWithGrantOption() {
        return null;
    }

    /**
     * table block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#table LakeformationPermissions#table}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lakeformation_permissions.LakeformationPermissionsTable getTable() {
        return null;
    }

    /**
     * table_with_columns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#table_with_columns LakeformationPermissions#table_with_columns}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lakeformation_permissions.LakeformationPermissionsTableWithColumns getTableWithColumns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationPermissionsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationPermissionsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationPermissionsConfig> {
        java.util.List<java.lang.String> permissions;
        java.lang.String principal;
        java.lang.String catalogId;
        java.lang.Object catalogResource;
        imports.aws.lakeformation_permissions.LakeformationPermissionsDatabase database;
        imports.aws.lakeformation_permissions.LakeformationPermissionsDataCellsFilter dataCellsFilter;
        imports.aws.lakeformation_permissions.LakeformationPermissionsDataLocation dataLocation;
        java.lang.String id;
        imports.aws.lakeformation_permissions.LakeformationPermissionsLfTag lfTag;
        imports.aws.lakeformation_permissions.LakeformationPermissionsLfTagPolicy lfTagPolicy;
        java.util.List<java.lang.String> permissionsWithGrantOption;
        imports.aws.lakeformation_permissions.LakeformationPermissionsTable table;
        imports.aws.lakeformation_permissions.LakeformationPermissionsTableWithColumns tableWithColumns;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getPermissions}
         * @param permissions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#permissions LakeformationPermissions#permissions}. This parameter is required.
         * @return {@code this}
         */
        public Builder permissions(java.util.List<java.lang.String> permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getPrincipal}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#principal LakeformationPermissions#principal}. This parameter is required.
         * @return {@code this}
         */
        public Builder principal(java.lang.String principal) {
            this.principal = principal;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#catalog_id LakeformationPermissions#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getCatalogResource}
         * @param catalogResource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#catalog_resource LakeformationPermissions#catalog_resource}.
         * @return {@code this}
         */
        public Builder catalogResource(java.lang.Boolean catalogResource) {
            this.catalogResource = catalogResource;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getCatalogResource}
         * @param catalogResource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#catalog_resource LakeformationPermissions#catalog_resource}.
         * @return {@code this}
         */
        public Builder catalogResource(com.hashicorp.cdktf.IResolvable catalogResource) {
            this.catalogResource = catalogResource;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getDatabase}
         * @param database database block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#database LakeformationPermissions#database}
         * @return {@code this}
         */
        public Builder database(imports.aws.lakeformation_permissions.LakeformationPermissionsDatabase database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getDataCellsFilter}
         * @param dataCellsFilter data_cells_filter block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#data_cells_filter LakeformationPermissions#data_cells_filter}
         * @return {@code this}
         */
        public Builder dataCellsFilter(imports.aws.lakeformation_permissions.LakeformationPermissionsDataCellsFilter dataCellsFilter) {
            this.dataCellsFilter = dataCellsFilter;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getDataLocation}
         * @param dataLocation data_location block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#data_location LakeformationPermissions#data_location}
         * @return {@code this}
         */
        public Builder dataLocation(imports.aws.lakeformation_permissions.LakeformationPermissionsDataLocation dataLocation) {
            this.dataLocation = dataLocation;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#id LakeformationPermissions#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getLfTag}
         * @param lfTag lf_tag block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#lf_tag LakeformationPermissions#lf_tag}
         * @return {@code this}
         */
        public Builder lfTag(imports.aws.lakeformation_permissions.LakeformationPermissionsLfTag lfTag) {
            this.lfTag = lfTag;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getLfTagPolicy}
         * @param lfTagPolicy lf_tag_policy block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#lf_tag_policy LakeformationPermissions#lf_tag_policy}
         * @return {@code this}
         */
        public Builder lfTagPolicy(imports.aws.lakeformation_permissions.LakeformationPermissionsLfTagPolicy lfTagPolicy) {
            this.lfTagPolicy = lfTagPolicy;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getPermissionsWithGrantOption}
         * @param permissionsWithGrantOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#permissions_with_grant_option LakeformationPermissions#permissions_with_grant_option}.
         * @return {@code this}
         */
        public Builder permissionsWithGrantOption(java.util.List<java.lang.String> permissionsWithGrantOption) {
            this.permissionsWithGrantOption = permissionsWithGrantOption;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getTable}
         * @param table table block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#table LakeformationPermissions#table}
         * @return {@code this}
         */
        public Builder table(imports.aws.lakeformation_permissions.LakeformationPermissionsTable table) {
            this.table = table;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getTableWithColumns}
         * @param tableWithColumns table_with_columns block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_permissions#table_with_columns LakeformationPermissions#table_with_columns}
         * @return {@code this}
         */
        public Builder tableWithColumns(imports.aws.lakeformation_permissions.LakeformationPermissionsTableWithColumns tableWithColumns) {
            this.tableWithColumns = tableWithColumns;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getDependsOn}
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
         * Sets the value of {@link LakeformationPermissionsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationPermissionsConfig#getProvisioners}
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
         * @return a new instance of {@link LakeformationPermissionsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationPermissionsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationPermissionsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationPermissionsConfig {
        private final java.util.List<java.lang.String> permissions;
        private final java.lang.String principal;
        private final java.lang.String catalogId;
        private final java.lang.Object catalogResource;
        private final imports.aws.lakeformation_permissions.LakeformationPermissionsDatabase database;
        private final imports.aws.lakeformation_permissions.LakeformationPermissionsDataCellsFilter dataCellsFilter;
        private final imports.aws.lakeformation_permissions.LakeformationPermissionsDataLocation dataLocation;
        private final java.lang.String id;
        private final imports.aws.lakeformation_permissions.LakeformationPermissionsLfTag lfTag;
        private final imports.aws.lakeformation_permissions.LakeformationPermissionsLfTagPolicy lfTagPolicy;
        private final java.util.List<java.lang.String> permissionsWithGrantOption;
        private final imports.aws.lakeformation_permissions.LakeformationPermissionsTable table;
        private final imports.aws.lakeformation_permissions.LakeformationPermissionsTableWithColumns tableWithColumns;
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
            this.permissions = software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.principal = software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogResource = software.amazon.jsii.Kernel.get(this, "catalogResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_permissions.LakeformationPermissionsDatabase.class));
            this.dataCellsFilter = software.amazon.jsii.Kernel.get(this, "dataCellsFilter", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_permissions.LakeformationPermissionsDataCellsFilter.class));
            this.dataLocation = software.amazon.jsii.Kernel.get(this, "dataLocation", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_permissions.LakeformationPermissionsDataLocation.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lfTag = software.amazon.jsii.Kernel.get(this, "lfTag", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_permissions.LakeformationPermissionsLfTag.class));
            this.lfTagPolicy = software.amazon.jsii.Kernel.get(this, "lfTagPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_permissions.LakeformationPermissionsLfTagPolicy.class));
            this.permissionsWithGrantOption = software.amazon.jsii.Kernel.get(this, "permissionsWithGrantOption", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.table = software.amazon.jsii.Kernel.get(this, "table", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_permissions.LakeformationPermissionsTable.class));
            this.tableWithColumns = software.amazon.jsii.Kernel.get(this, "tableWithColumns", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_permissions.LakeformationPermissionsTableWithColumns.class));
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
            this.permissions = java.util.Objects.requireNonNull(builder.permissions, "permissions is required");
            this.principal = java.util.Objects.requireNonNull(builder.principal, "principal is required");
            this.catalogId = builder.catalogId;
            this.catalogResource = builder.catalogResource;
            this.database = builder.database;
            this.dataCellsFilter = builder.dataCellsFilter;
            this.dataLocation = builder.dataLocation;
            this.id = builder.id;
            this.lfTag = builder.lfTag;
            this.lfTagPolicy = builder.lfTagPolicy;
            this.permissionsWithGrantOption = builder.permissionsWithGrantOption;
            this.table = builder.table;
            this.tableWithColumns = builder.tableWithColumns;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getPermissions() {
            return this.permissions;
        }

        @Override
        public final java.lang.String getPrincipal() {
            return this.principal;
        }

        @Override
        public final java.lang.String getCatalogId() {
            return this.catalogId;
        }

        @Override
        public final java.lang.Object getCatalogResource() {
            return this.catalogResource;
        }

        @Override
        public final imports.aws.lakeformation_permissions.LakeformationPermissionsDatabase getDatabase() {
            return this.database;
        }

        @Override
        public final imports.aws.lakeformation_permissions.LakeformationPermissionsDataCellsFilter getDataCellsFilter() {
            return this.dataCellsFilter;
        }

        @Override
        public final imports.aws.lakeformation_permissions.LakeformationPermissionsDataLocation getDataLocation() {
            return this.dataLocation;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.lakeformation_permissions.LakeformationPermissionsLfTag getLfTag() {
            return this.lfTag;
        }

        @Override
        public final imports.aws.lakeformation_permissions.LakeformationPermissionsLfTagPolicy getLfTagPolicy() {
            return this.lfTagPolicy;
        }

        @Override
        public final java.util.List<java.lang.String> getPermissionsWithGrantOption() {
            return this.permissionsWithGrantOption;
        }

        @Override
        public final imports.aws.lakeformation_permissions.LakeformationPermissionsTable getTable() {
            return this.table;
        }

        @Override
        public final imports.aws.lakeformation_permissions.LakeformationPermissionsTableWithColumns getTableWithColumns() {
            return this.tableWithColumns;
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

            data.set("permissions", om.valueToTree(this.getPermissions()));
            data.set("principal", om.valueToTree(this.getPrincipal()));
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }
            if (this.getCatalogResource() != null) {
                data.set("catalogResource", om.valueToTree(this.getCatalogResource()));
            }
            if (this.getDatabase() != null) {
                data.set("database", om.valueToTree(this.getDatabase()));
            }
            if (this.getDataCellsFilter() != null) {
                data.set("dataCellsFilter", om.valueToTree(this.getDataCellsFilter()));
            }
            if (this.getDataLocation() != null) {
                data.set("dataLocation", om.valueToTree(this.getDataLocation()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLfTag() != null) {
                data.set("lfTag", om.valueToTree(this.getLfTag()));
            }
            if (this.getLfTagPolicy() != null) {
                data.set("lfTagPolicy", om.valueToTree(this.getLfTagPolicy()));
            }
            if (this.getPermissionsWithGrantOption() != null) {
                data.set("permissionsWithGrantOption", om.valueToTree(this.getPermissionsWithGrantOption()));
            }
            if (this.getTable() != null) {
                data.set("table", om.valueToTree(this.getTable()));
            }
            if (this.getTableWithColumns() != null) {
                data.set("tableWithColumns", om.valueToTree(this.getTableWithColumns()));
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
            struct.set("fqn", om.valueToTree("aws.lakeformationPermissions.LakeformationPermissionsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationPermissionsConfig.Jsii$Proxy that = (LakeformationPermissionsConfig.Jsii$Proxy) o;

            if (!permissions.equals(that.permissions)) return false;
            if (!principal.equals(that.principal)) return false;
            if (this.catalogId != null ? !this.catalogId.equals(that.catalogId) : that.catalogId != null) return false;
            if (this.catalogResource != null ? !this.catalogResource.equals(that.catalogResource) : that.catalogResource != null) return false;
            if (this.database != null ? !this.database.equals(that.database) : that.database != null) return false;
            if (this.dataCellsFilter != null ? !this.dataCellsFilter.equals(that.dataCellsFilter) : that.dataCellsFilter != null) return false;
            if (this.dataLocation != null ? !this.dataLocation.equals(that.dataLocation) : that.dataLocation != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lfTag != null ? !this.lfTag.equals(that.lfTag) : that.lfTag != null) return false;
            if (this.lfTagPolicy != null ? !this.lfTagPolicy.equals(that.lfTagPolicy) : that.lfTagPolicy != null) return false;
            if (this.permissionsWithGrantOption != null ? !this.permissionsWithGrantOption.equals(that.permissionsWithGrantOption) : that.permissionsWithGrantOption != null) return false;
            if (this.table != null ? !this.table.equals(that.table) : that.table != null) return false;
            if (this.tableWithColumns != null ? !this.tableWithColumns.equals(that.tableWithColumns) : that.tableWithColumns != null) return false;
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
            int result = this.permissions.hashCode();
            result = 31 * result + (this.principal.hashCode());
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            result = 31 * result + (this.catalogResource != null ? this.catalogResource.hashCode() : 0);
            result = 31 * result + (this.database != null ? this.database.hashCode() : 0);
            result = 31 * result + (this.dataCellsFilter != null ? this.dataCellsFilter.hashCode() : 0);
            result = 31 * result + (this.dataLocation != null ? this.dataLocation.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lfTag != null ? this.lfTag.hashCode() : 0);
            result = 31 * result + (this.lfTagPolicy != null ? this.lfTagPolicy.hashCode() : 0);
            result = 31 * result + (this.permissionsWithGrantOption != null ? this.permissionsWithGrantOption.hashCode() : 0);
            result = 31 * result + (this.table != null ? this.table.hashCode() : 0);
            result = 31 * result + (this.tableWithColumns != null ? this.tableWithColumns.hashCode() : 0);
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
