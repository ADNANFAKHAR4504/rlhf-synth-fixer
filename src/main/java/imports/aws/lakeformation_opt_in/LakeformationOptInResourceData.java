package imports.aws.lakeformation_opt_in;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.486Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationOptIn.LakeformationOptInResourceData")
@software.amazon.jsii.Jsii.Proxy(LakeformationOptInResourceData.Jsii$Proxy.class)
public interface LakeformationOptInResourceData extends software.amazon.jsii.JsiiSerializable {

    /**
     * catalog block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#catalog LakeformationOptIn#catalog}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCatalog() {
        return null;
    }

    /**
     * database block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#database LakeformationOptIn#database}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDatabase() {
        return null;
    }

    /**
     * data_cells_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#data_cells_filter LakeformationOptIn#data_cells_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataCellsFilter() {
        return null;
    }

    /**
     * data_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#data_location LakeformationOptIn#data_location}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataLocation() {
        return null;
    }

    /**
     * lf_tag block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag LakeformationOptIn#lf_tag}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLfTag() {
        return null;
    }

    /**
     * lf_tag_expression block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag_expression LakeformationOptIn#lf_tag_expression}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLfTagExpression() {
        return null;
    }

    /**
     * lf_tag_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag_policy LakeformationOptIn#lf_tag_policy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLfTagPolicy() {
        return null;
    }

    /**
     * table block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table LakeformationOptIn#table}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTable() {
        return null;
    }

    /**
     * table_with_columns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table_with_columns LakeformationOptIn#table_with_columns}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTableWithColumns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationOptInResourceData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationOptInResourceData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationOptInResourceData> {
        java.lang.Object catalog;
        java.lang.Object database;
        java.lang.Object dataCellsFilter;
        java.lang.Object dataLocation;
        java.lang.Object lfTag;
        java.lang.Object lfTagExpression;
        java.lang.Object lfTagPolicy;
        java.lang.Object table;
        java.lang.Object tableWithColumns;

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getCatalog}
         * @param catalog catalog block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#catalog LakeformationOptIn#catalog}
         * @return {@code this}
         */
        public Builder catalog(com.hashicorp.cdktf.IResolvable catalog) {
            this.catalog = catalog;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getCatalog}
         * @param catalog catalog block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#catalog LakeformationOptIn#catalog}
         * @return {@code this}
         */
        public Builder catalog(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataCatalog> catalog) {
            this.catalog = catalog;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getDatabase}
         * @param database database block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#database LakeformationOptIn#database}
         * @return {@code this}
         */
        public Builder database(com.hashicorp.cdktf.IResolvable database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getDatabase}
         * @param database database block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#database LakeformationOptIn#database}
         * @return {@code this}
         */
        public Builder database(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataDatabase> database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getDataCellsFilter}
         * @param dataCellsFilter data_cells_filter block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#data_cells_filter LakeformationOptIn#data_cells_filter}
         * @return {@code this}
         */
        public Builder dataCellsFilter(com.hashicorp.cdktf.IResolvable dataCellsFilter) {
            this.dataCellsFilter = dataCellsFilter;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getDataCellsFilter}
         * @param dataCellsFilter data_cells_filter block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#data_cells_filter LakeformationOptIn#data_cells_filter}
         * @return {@code this}
         */
        public Builder dataCellsFilter(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataDataCellsFilter> dataCellsFilter) {
            this.dataCellsFilter = dataCellsFilter;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getDataLocation}
         * @param dataLocation data_location block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#data_location LakeformationOptIn#data_location}
         * @return {@code this}
         */
        public Builder dataLocation(com.hashicorp.cdktf.IResolvable dataLocation) {
            this.dataLocation = dataLocation;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getDataLocation}
         * @param dataLocation data_location block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#data_location LakeformationOptIn#data_location}
         * @return {@code this}
         */
        public Builder dataLocation(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataDataLocation> dataLocation) {
            this.dataLocation = dataLocation;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getLfTag}
         * @param lfTag lf_tag block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag LakeformationOptIn#lf_tag}
         * @return {@code this}
         */
        public Builder lfTag(com.hashicorp.cdktf.IResolvable lfTag) {
            this.lfTag = lfTag;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getLfTag}
         * @param lfTag lf_tag block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag LakeformationOptIn#lf_tag}
         * @return {@code this}
         */
        public Builder lfTag(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataLfTag> lfTag) {
            this.lfTag = lfTag;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getLfTagExpression}
         * @param lfTagExpression lf_tag_expression block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag_expression LakeformationOptIn#lf_tag_expression}
         * @return {@code this}
         */
        public Builder lfTagExpression(com.hashicorp.cdktf.IResolvable lfTagExpression) {
            this.lfTagExpression = lfTagExpression;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getLfTagExpression}
         * @param lfTagExpression lf_tag_expression block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag_expression LakeformationOptIn#lf_tag_expression}
         * @return {@code this}
         */
        public Builder lfTagExpression(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataLfTagExpression> lfTagExpression) {
            this.lfTagExpression = lfTagExpression;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getLfTagPolicy}
         * @param lfTagPolicy lf_tag_policy block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag_policy LakeformationOptIn#lf_tag_policy}
         * @return {@code this}
         */
        public Builder lfTagPolicy(com.hashicorp.cdktf.IResolvable lfTagPolicy) {
            this.lfTagPolicy = lfTagPolicy;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getLfTagPolicy}
         * @param lfTagPolicy lf_tag_policy block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#lf_tag_policy LakeformationOptIn#lf_tag_policy}
         * @return {@code this}
         */
        public Builder lfTagPolicy(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataLfTagPolicy> lfTagPolicy) {
            this.lfTagPolicy = lfTagPolicy;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getTable}
         * @param table table block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table LakeformationOptIn#table}
         * @return {@code this}
         */
        public Builder table(com.hashicorp.cdktf.IResolvable table) {
            this.table = table;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getTable}
         * @param table table block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table LakeformationOptIn#table}
         * @return {@code this}
         */
        public Builder table(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataTable> table) {
            this.table = table;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getTableWithColumns}
         * @param tableWithColumns table_with_columns block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table_with_columns LakeformationOptIn#table_with_columns}
         * @return {@code this}
         */
        public Builder tableWithColumns(com.hashicorp.cdktf.IResolvable tableWithColumns) {
            this.tableWithColumns = tableWithColumns;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceData#getTableWithColumns}
         * @param tableWithColumns table_with_columns block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table_with_columns LakeformationOptIn#table_with_columns}
         * @return {@code this}
         */
        public Builder tableWithColumns(java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataTableWithColumns> tableWithColumns) {
            this.tableWithColumns = tableWithColumns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationOptInResourceData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationOptInResourceData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationOptInResourceData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationOptInResourceData {
        private final java.lang.Object catalog;
        private final java.lang.Object database;
        private final java.lang.Object dataCellsFilter;
        private final java.lang.Object dataLocation;
        private final java.lang.Object lfTag;
        private final java.lang.Object lfTagExpression;
        private final java.lang.Object lfTagPolicy;
        private final java.lang.Object table;
        private final java.lang.Object tableWithColumns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.catalog = software.amazon.jsii.Kernel.get(this, "catalog", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataCellsFilter = software.amazon.jsii.Kernel.get(this, "dataCellsFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataLocation = software.amazon.jsii.Kernel.get(this, "dataLocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lfTag = software.amazon.jsii.Kernel.get(this, "lfTag", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lfTagExpression = software.amazon.jsii.Kernel.get(this, "lfTagExpression", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lfTagPolicy = software.amazon.jsii.Kernel.get(this, "lfTagPolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.table = software.amazon.jsii.Kernel.get(this, "table", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tableWithColumns = software.amazon.jsii.Kernel.get(this, "tableWithColumns", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.catalog = builder.catalog;
            this.database = builder.database;
            this.dataCellsFilter = builder.dataCellsFilter;
            this.dataLocation = builder.dataLocation;
            this.lfTag = builder.lfTag;
            this.lfTagExpression = builder.lfTagExpression;
            this.lfTagPolicy = builder.lfTagPolicy;
            this.table = builder.table;
            this.tableWithColumns = builder.tableWithColumns;
        }

        @Override
        public final java.lang.Object getCatalog() {
            return this.catalog;
        }

        @Override
        public final java.lang.Object getDatabase() {
            return this.database;
        }

        @Override
        public final java.lang.Object getDataCellsFilter() {
            return this.dataCellsFilter;
        }

        @Override
        public final java.lang.Object getDataLocation() {
            return this.dataLocation;
        }

        @Override
        public final java.lang.Object getLfTag() {
            return this.lfTag;
        }

        @Override
        public final java.lang.Object getLfTagExpression() {
            return this.lfTagExpression;
        }

        @Override
        public final java.lang.Object getLfTagPolicy() {
            return this.lfTagPolicy;
        }

        @Override
        public final java.lang.Object getTable() {
            return this.table;
        }

        @Override
        public final java.lang.Object getTableWithColumns() {
            return this.tableWithColumns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCatalog() != null) {
                data.set("catalog", om.valueToTree(this.getCatalog()));
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
            if (this.getLfTag() != null) {
                data.set("lfTag", om.valueToTree(this.getLfTag()));
            }
            if (this.getLfTagExpression() != null) {
                data.set("lfTagExpression", om.valueToTree(this.getLfTagExpression()));
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

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationOptIn.LakeformationOptInResourceData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationOptInResourceData.Jsii$Proxy that = (LakeformationOptInResourceData.Jsii$Proxy) o;

            if (this.catalog != null ? !this.catalog.equals(that.catalog) : that.catalog != null) return false;
            if (this.database != null ? !this.database.equals(that.database) : that.database != null) return false;
            if (this.dataCellsFilter != null ? !this.dataCellsFilter.equals(that.dataCellsFilter) : that.dataCellsFilter != null) return false;
            if (this.dataLocation != null ? !this.dataLocation.equals(that.dataLocation) : that.dataLocation != null) return false;
            if (this.lfTag != null ? !this.lfTag.equals(that.lfTag) : that.lfTag != null) return false;
            if (this.lfTagExpression != null ? !this.lfTagExpression.equals(that.lfTagExpression) : that.lfTagExpression != null) return false;
            if (this.lfTagPolicy != null ? !this.lfTagPolicy.equals(that.lfTagPolicy) : that.lfTagPolicy != null) return false;
            if (this.table != null ? !this.table.equals(that.table) : that.table != null) return false;
            return this.tableWithColumns != null ? this.tableWithColumns.equals(that.tableWithColumns) : that.tableWithColumns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.catalog != null ? this.catalog.hashCode() : 0;
            result = 31 * result + (this.database != null ? this.database.hashCode() : 0);
            result = 31 * result + (this.dataCellsFilter != null ? this.dataCellsFilter.hashCode() : 0);
            result = 31 * result + (this.dataLocation != null ? this.dataLocation.hashCode() : 0);
            result = 31 * result + (this.lfTag != null ? this.lfTag.hashCode() : 0);
            result = 31 * result + (this.lfTagExpression != null ? this.lfTagExpression.hashCode() : 0);
            result = 31 * result + (this.lfTagPolicy != null ? this.lfTagPolicy.hashCode() : 0);
            result = 31 * result + (this.table != null ? this.table.hashCode() : 0);
            result = 31 * result + (this.tableWithColumns != null ? this.tableWithColumns.hashCode() : 0);
            return result;
        }
    }
}
