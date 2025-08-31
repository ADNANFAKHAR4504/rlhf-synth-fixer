package imports.aws.data_aws_lakeformation_permissions;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.718Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLakeformationPermissions.DataAwsLakeformationPermissionsDataCellsFilter")
@software.amazon.jsii.Jsii.Proxy(DataAwsLakeformationPermissionsDataCellsFilter.Jsii$Proxy.class)
public interface DataAwsLakeformationPermissionsDataCellsFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#database_name DataAwsLakeformationPermissions#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#name DataAwsLakeformationPermissions#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table_catalog_id DataAwsLakeformationPermissions#table_catalog_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableCatalogId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table_name DataAwsLakeformationPermissions#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * @return a {@link Builder} of {@link DataAwsLakeformationPermissionsDataCellsFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsLakeformationPermissionsDataCellsFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsLakeformationPermissionsDataCellsFilter> {
        java.lang.String databaseName;
        java.lang.String name;
        java.lang.String tableCatalogId;
        java.lang.String tableName;

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsDataCellsFilter#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#database_name DataAwsLakeformationPermissions#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsDataCellsFilter#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#name DataAwsLakeformationPermissions#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsDataCellsFilter#getTableCatalogId}
         * @param tableCatalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table_catalog_id DataAwsLakeformationPermissions#table_catalog_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableCatalogId(java.lang.String tableCatalogId) {
            this.tableCatalogId = tableCatalogId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsDataCellsFilter#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#table_name DataAwsLakeformationPermissions#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsLakeformationPermissionsDataCellsFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsLakeformationPermissionsDataCellsFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsLakeformationPermissionsDataCellsFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsLakeformationPermissionsDataCellsFilter {
        private final java.lang.String databaseName;
        private final java.lang.String name;
        private final java.lang.String tableCatalogId;
        private final java.lang.String tableName;

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
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("tableCatalogId", om.valueToTree(this.getTableCatalogId()));
            data.set("tableName", om.valueToTree(this.getTableName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsLakeformationPermissions.DataAwsLakeformationPermissionsDataCellsFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsLakeformationPermissionsDataCellsFilter.Jsii$Proxy that = (DataAwsLakeformationPermissionsDataCellsFilter.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!name.equals(that.name)) return false;
            if (!tableCatalogId.equals(that.tableCatalogId)) return false;
            return this.tableName.equals(that.tableName);
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.tableCatalogId.hashCode());
            result = 31 * result + (this.tableName.hashCode());
            return result;
        }
    }
}
