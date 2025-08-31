package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapCustomSql")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetPhysicalTableMapCustomSql.Jsii$Proxy.class)
public interface QuicksightDataSetPhysicalTableMapCustomSql extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSourceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#sql_query QuicksightDataSet#sql_query}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSqlQuery();

    /**
     * columns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getColumns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetPhysicalTableMapCustomSql}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetPhysicalTableMapCustomSql}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetPhysicalTableMapCustomSql> {
        java.lang.String dataSourceArn;
        java.lang.String name;
        java.lang.String sqlQuery;
        java.lang.Object columns;

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapCustomSql#getDataSourceArn}
         * @param dataSourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSourceArn(java.lang.String dataSourceArn) {
            this.dataSourceArn = dataSourceArn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapCustomSql#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapCustomSql#getSqlQuery}
         * @param sqlQuery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#sql_query QuicksightDataSet#sql_query}. This parameter is required.
         * @return {@code this}
         */
        public Builder sqlQuery(java.lang.String sqlQuery) {
            this.sqlQuery = sqlQuery;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapCustomSql#getColumns}
         * @param columns columns block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
         * @return {@code this}
         */
        public Builder columns(com.hashicorp.cdktf.IResolvable columns) {
            this.columns = columns;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapCustomSql#getColumns}
         * @param columns columns block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
         * @return {@code this}
         */
        public Builder columns(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSqlColumns> columns) {
            this.columns = columns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetPhysicalTableMapCustomSql}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetPhysicalTableMapCustomSql build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetPhysicalTableMapCustomSql}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetPhysicalTableMapCustomSql {
        private final java.lang.String dataSourceArn;
        private final java.lang.String name;
        private final java.lang.String sqlQuery;
        private final java.lang.Object columns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSourceArn = software.amazon.jsii.Kernel.get(this, "dataSourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sqlQuery = software.amazon.jsii.Kernel.get(this, "sqlQuery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.columns = software.amazon.jsii.Kernel.get(this, "columns", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSourceArn = java.util.Objects.requireNonNull(builder.dataSourceArn, "dataSourceArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.sqlQuery = java.util.Objects.requireNonNull(builder.sqlQuery, "sqlQuery is required");
            this.columns = builder.columns;
        }

        @Override
        public final java.lang.String getDataSourceArn() {
            return this.dataSourceArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getSqlQuery() {
            return this.sqlQuery;
        }

        @Override
        public final java.lang.Object getColumns() {
            return this.columns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataSourceArn", om.valueToTree(this.getDataSourceArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("sqlQuery", om.valueToTree(this.getSqlQuery()));
            if (this.getColumns() != null) {
                data.set("columns", om.valueToTree(this.getColumns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapCustomSql"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetPhysicalTableMapCustomSql.Jsii$Proxy that = (QuicksightDataSetPhysicalTableMapCustomSql.Jsii$Proxy) o;

            if (!dataSourceArn.equals(that.dataSourceArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!sqlQuery.equals(that.sqlQuery)) return false;
            return this.columns != null ? this.columns.equals(that.columns) : that.columns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataSourceArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.sqlQuery.hashCode());
            result = 31 * result + (this.columns != null ? this.columns.hashCode() : 0);
            return result;
        }
    }
}
