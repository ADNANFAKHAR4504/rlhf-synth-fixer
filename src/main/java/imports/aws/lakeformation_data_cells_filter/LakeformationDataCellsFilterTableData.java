package imports.aws.lakeformation_data_cells_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.483Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationDataCellsFilter.LakeformationDataCellsFilterTableData")
@software.amazon.jsii.Jsii.Proxy(LakeformationDataCellsFilterTableData.Jsii$Proxy.class)
public interface LakeformationDataCellsFilterTableData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#database_name LakeformationDataCellsFilter#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#name LakeformationDataCellsFilter#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#table_catalog_id LakeformationDataCellsFilter#table_catalog_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableCatalogId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#table_name LakeformationDataCellsFilter#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#column_names LakeformationDataCellsFilter#column_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getColumnNames() {
        return null;
    }

    /**
     * column_wildcard block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#column_wildcard LakeformationDataCellsFilter#column_wildcard}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getColumnWildcard() {
        return null;
    }

    /**
     * row_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#row_filter LakeformationDataCellsFilter#row_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRowFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#version_id LakeformationDataCellsFilter#version_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersionId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationDataCellsFilterTableData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationDataCellsFilterTableData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationDataCellsFilterTableData> {
        java.lang.String databaseName;
        java.lang.String name;
        java.lang.String tableCatalogId;
        java.lang.String tableName;
        java.util.List<java.lang.String> columnNames;
        java.lang.Object columnWildcard;
        java.lang.Object rowFilter;
        java.lang.String versionId;

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#database_name LakeformationDataCellsFilter#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#name LakeformationDataCellsFilter#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getTableCatalogId}
         * @param tableCatalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#table_catalog_id LakeformationDataCellsFilter#table_catalog_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableCatalogId(java.lang.String tableCatalogId) {
            this.tableCatalogId = tableCatalogId;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#table_name LakeformationDataCellsFilter#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getColumnNames}
         * @param columnNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#column_names LakeformationDataCellsFilter#column_names}.
         * @return {@code this}
         */
        public Builder columnNames(java.util.List<java.lang.String> columnNames) {
            this.columnNames = columnNames;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getColumnWildcard}
         * @param columnWildcard column_wildcard block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#column_wildcard LakeformationDataCellsFilter#column_wildcard}
         * @return {@code this}
         */
        public Builder columnWildcard(com.hashicorp.cdktf.IResolvable columnWildcard) {
            this.columnWildcard = columnWildcard;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getColumnWildcard}
         * @param columnWildcard column_wildcard block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#column_wildcard LakeformationDataCellsFilter#column_wildcard}
         * @return {@code this}
         */
        public Builder columnWildcard(java.util.List<? extends imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataColumnWildcard> columnWildcard) {
            this.columnWildcard = columnWildcard;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getRowFilter}
         * @param rowFilter row_filter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#row_filter LakeformationDataCellsFilter#row_filter}
         * @return {@code this}
         */
        public Builder rowFilter(com.hashicorp.cdktf.IResolvable rowFilter) {
            this.rowFilter = rowFilter;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getRowFilter}
         * @param rowFilter row_filter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#row_filter LakeformationDataCellsFilter#row_filter}
         * @return {@code this}
         */
        public Builder rowFilter(java.util.List<? extends imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilter> rowFilter) {
            this.rowFilter = rowFilter;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableData#getVersionId}
         * @param versionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#version_id LakeformationDataCellsFilter#version_id}.
         * @return {@code this}
         */
        public Builder versionId(java.lang.String versionId) {
            this.versionId = versionId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationDataCellsFilterTableData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationDataCellsFilterTableData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationDataCellsFilterTableData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationDataCellsFilterTableData {
        private final java.lang.String databaseName;
        private final java.lang.String name;
        private final java.lang.String tableCatalogId;
        private final java.lang.String tableName;
        private final java.util.List<java.lang.String> columnNames;
        private final java.lang.Object columnWildcard;
        private final java.lang.Object rowFilter;
        private final java.lang.String versionId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableCatalogId = software.amazon.jsii.Kernel.get(this, "tableCatalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.columnNames = software.amazon.jsii.Kernel.get(this, "columnNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.columnWildcard = software.amazon.jsii.Kernel.get(this, "columnWildcard", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.rowFilter = software.amazon.jsii.Kernel.get(this, "rowFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.versionId = software.amazon.jsii.Kernel.get(this, "versionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.tableCatalogId = java.util.Objects.requireNonNull(builder.tableCatalogId, "tableCatalogId is required");
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
            this.columnNames = builder.columnNames;
            this.columnWildcard = builder.columnWildcard;
            this.rowFilter = builder.rowFilter;
            this.versionId = builder.versionId;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getTableCatalogId() {
            return this.tableCatalogId;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        public final java.util.List<java.lang.String> getColumnNames() {
            return this.columnNames;
        }

        @Override
        public final java.lang.Object getColumnWildcard() {
            return this.columnWildcard;
        }

        @Override
        public final java.lang.Object getRowFilter() {
            return this.rowFilter;
        }

        @Override
        public final java.lang.String getVersionId() {
            return this.versionId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("tableCatalogId", om.valueToTree(this.getTableCatalogId()));
            data.set("tableName", om.valueToTree(this.getTableName()));
            if (this.getColumnNames() != null) {
                data.set("columnNames", om.valueToTree(this.getColumnNames()));
            }
            if (this.getColumnWildcard() != null) {
                data.set("columnWildcard", om.valueToTree(this.getColumnWildcard()));
            }
            if (this.getRowFilter() != null) {
                data.set("rowFilter", om.valueToTree(this.getRowFilter()));
            }
            if (this.getVersionId() != null) {
                data.set("versionId", om.valueToTree(this.getVersionId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationDataCellsFilter.LakeformationDataCellsFilterTableData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationDataCellsFilterTableData.Jsii$Proxy that = (LakeformationDataCellsFilterTableData.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!name.equals(that.name)) return false;
            if (!tableCatalogId.equals(that.tableCatalogId)) return false;
            if (!tableName.equals(that.tableName)) return false;
            if (this.columnNames != null ? !this.columnNames.equals(that.columnNames) : that.columnNames != null) return false;
            if (this.columnWildcard != null ? !this.columnWildcard.equals(that.columnWildcard) : that.columnWildcard != null) return false;
            if (this.rowFilter != null ? !this.rowFilter.equals(that.rowFilter) : that.rowFilter != null) return false;
            return this.versionId != null ? this.versionId.equals(that.versionId) : that.versionId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.tableCatalogId.hashCode());
            result = 31 * result + (this.tableName.hashCode());
            result = 31 * result + (this.columnNames != null ? this.columnNames.hashCode() : 0);
            result = 31 * result + (this.columnWildcard != null ? this.columnWildcard.hashCode() : 0);
            result = 31 * result + (this.rowFilter != null ? this.rowFilter.hashCode() : 0);
            result = 31 * result + (this.versionId != null ? this.versionId.hashCode() : 0);
            return result;
        }
    }
}
