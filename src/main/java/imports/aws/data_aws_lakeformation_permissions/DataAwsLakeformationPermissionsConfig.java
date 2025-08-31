package imports.aws.data_aws_lakeformation_permissions;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.718Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLakeformationPermissions.DataAwsLakeformationPermissionsConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsLakeformationPermissionsConfig.Jsii$Proxy.class)
public interface DataAwsLakeformationPermissionsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#principal DataAwsLakeformationPermissions#principal}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrincipal();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_id DataAwsLakeformationPermissions#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_resource DataAwsLakeformationPermissions#catalog_resource}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCatalogResource() {
        return null;
    }

    /**
     * database block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#database DataAwsLakeformationPermissions#database}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase getDatabase() {
        return null;
    }

    /**
     * data_cells_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#data_cells_filter DataAwsLakeformationPermissions#data_cells_filter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter getDataCellsFilter() {
        return null;
    }

    /**
     * data_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#data_location DataAwsLakeformationPermissions#data_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation getDataLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#id DataAwsLakeformationPermissions#id}.
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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#lf_tag DataAwsLakeformationPermissions#lf_tag}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag getLfTag() {
        return null;
    }

    /**
     * lf_tag_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#lf_tag_policy DataAwsLakeformationPermissions#lf_tag_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy getLfTagPolicy() {
        return null;
    }

    /**
     * table block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table DataAwsLakeformationPermissions#table}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable getTable() {
        return null;
    }

    /**
     * table_with_columns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table_with_columns DataAwsLakeformationPermissions#table_with_columns}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns getTableWithColumns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsLakeformationPermissionsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsLakeformationPermissionsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsLakeformationPermissionsConfig> {
        java.lang.String principal;
        java.lang.String catalogId;
        java.lang.Object catalogResource;
        imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase database;
        imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter dataCellsFilter;
        imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation dataLocation;
        java.lang.String id;
        imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag lfTag;
        imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy lfTagPolicy;
        imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable table;
        imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns tableWithColumns;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getPrincipal}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#principal DataAwsLakeformationPermissions#principal}. This parameter is required.
         * @return {@code this}
         */
        public Builder principal(java.lang.String principal) {
            this.principal = principal;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_id DataAwsLakeformationPermissions#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getCatalogResource}
         * @param catalogResource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_resource DataAwsLakeformationPermissions#catalog_resource}.
         * @return {@code this}
         */
        public Builder catalogResource(java.lang.Boolean catalogResource) {
            this.catalogResource = catalogResource;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getCatalogResource}
         * @param catalogResource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_resource DataAwsLakeformationPermissions#catalog_resource}.
         * @return {@code this}
         */
        public Builder catalogResource(com.hashicorp.cdktf.IResolvable catalogResource) {
            this.catalogResource = catalogResource;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getDatabase}
         * @param database database block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#database DataAwsLakeformationPermissions#database}
         * @return {@code this}
         */
        public Builder database(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getDataCellsFilter}
         * @param dataCellsFilter data_cells_filter block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#data_cells_filter DataAwsLakeformationPermissions#data_cells_filter}
         * @return {@code this}
         */
        public Builder dataCellsFilter(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter dataCellsFilter) {
            this.dataCellsFilter = dataCellsFilter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getDataLocation}
         * @param dataLocation data_location block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#data_location DataAwsLakeformationPermissions#data_location}
         * @return {@code this}
         */
        public Builder dataLocation(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation dataLocation) {
            this.dataLocation = dataLocation;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#id DataAwsLakeformationPermissions#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getLfTag}
         * @param lfTag lf_tag block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#lf_tag DataAwsLakeformationPermissions#lf_tag}
         * @return {@code this}
         */
        public Builder lfTag(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag lfTag) {
            this.lfTag = lfTag;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getLfTagPolicy}
         * @param lfTagPolicy lf_tag_policy block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#lf_tag_policy DataAwsLakeformationPermissions#lf_tag_policy}
         * @return {@code this}
         */
        public Builder lfTagPolicy(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy lfTagPolicy) {
            this.lfTagPolicy = lfTagPolicy;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getTable}
         * @param table table block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table DataAwsLakeformationPermissions#table}
         * @return {@code this}
         */
        public Builder table(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable table) {
            this.table = table;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getTableWithColumns}
         * @param tableWithColumns table_with_columns block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table_with_columns DataAwsLakeformationPermissions#table_with_columns}
         * @return {@code this}
         */
        public Builder tableWithColumns(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns tableWithColumns) {
            this.tableWithColumns = tableWithColumns;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsLakeformationPermissionsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsLakeformationPermissionsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsLakeformationPermissionsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsLakeformationPermissionsConfig {
        private final java.lang.String principal;
        private final java.lang.String catalogId;
        private final java.lang.Object catalogResource;
        private final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase database;
        private final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter dataCellsFilter;
        private final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation dataLocation;
        private final java.lang.String id;
        private final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag lfTag;
        private final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy lfTagPolicy;
        private final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable table;
        private final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns tableWithColumns;
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
            this.principal = software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogResource = software.amazon.jsii.Kernel.get(this, "catalogResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase.class));
            this.dataCellsFilter = software.amazon.jsii.Kernel.get(this, "dataCellsFilter", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter.class));
            this.dataLocation = software.amazon.jsii.Kernel.get(this, "dataLocation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lfTag = software.amazon.jsii.Kernel.get(this, "lfTag", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag.class));
            this.lfTagPolicy = software.amazon.jsii.Kernel.get(this, "lfTagPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy.class));
            this.table = software.amazon.jsii.Kernel.get(this, "table", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable.class));
            this.tableWithColumns = software.amazon.jsii.Kernel.get(this, "tableWithColumns", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns.class));
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
            this.principal = java.util.Objects.requireNonNull(builder.principal, "principal is required");
            this.catalogId = builder.catalogId;
            this.catalogResource = builder.catalogResource;
            this.database = builder.database;
            this.dataCellsFilter = builder.dataCellsFilter;
            this.dataLocation = builder.dataLocation;
            this.id = builder.id;
            this.lfTag = builder.lfTag;
            this.lfTagPolicy = builder.lfTagPolicy;
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
        public final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDatabase getDatabase() {
            return this.database;
        }

        @Override
        public final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataCellsFilter getDataCellsFilter() {
            return this.dataCellsFilter;
        }

        @Override
        public final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsDataLocation getDataLocation() {
            return this.dataLocation;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTag getLfTag() {
            return this.lfTag;
        }

        @Override
        public final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicy getLfTagPolicy() {
            return this.lfTagPolicy;
        }

        @Override
        public final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTable getTable() {
            return this.table;
        }

        @Override
        public final imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsTableWithColumns getTableWithColumns() {
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
            struct.set("fqn", om.valueToTree("aws.dataAwsLakeformationPermissions.DataAwsLakeformationPermissionsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsLakeformationPermissionsConfig.Jsii$Proxy that = (DataAwsLakeformationPermissionsConfig.Jsii$Proxy) o;

            if (!principal.equals(that.principal)) return false;
            if (this.catalogId != null ? !this.catalogId.equals(that.catalogId) : that.catalogId != null) return false;
            if (this.catalogResource != null ? !this.catalogResource.equals(that.catalogResource) : that.catalogResource != null) return false;
            if (this.database != null ? !this.database.equals(that.database) : that.database != null) return false;
            if (this.dataCellsFilter != null ? !this.dataCellsFilter.equals(that.dataCellsFilter) : that.dataCellsFilter != null) return false;
            if (this.dataLocation != null ? !this.dataLocation.equals(that.dataLocation) : that.dataLocation != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lfTag != null ? !this.lfTag.equals(that.lfTag) : that.lfTag != null) return false;
            if (this.lfTagPolicy != null ? !this.lfTagPolicy.equals(that.lfTagPolicy) : that.lfTagPolicy != null) return false;
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
            int result = this.principal.hashCode();
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            result = 31 * result + (this.catalogResource != null ? this.catalogResource.hashCode() : 0);
            result = 31 * result + (this.database != null ? this.database.hashCode() : 0);
            result = 31 * result + (this.dataCellsFilter != null ? this.dataCellsFilter.hashCode() : 0);
            result = 31 * result + (this.dataLocation != null ? this.dataLocation.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lfTag != null ? this.lfTag.hashCode() : 0);
            result = 31 * result + (this.lfTagPolicy != null ? this.lfTagPolicy.hashCode() : 0);
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
