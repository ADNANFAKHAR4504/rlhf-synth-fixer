package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapRelationalTable")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetPhysicalTableMapRelationalTable.Jsii$Proxy.class)
public interface QuicksightDataSetPhysicalTableMapRelationalTable extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSourceArn();

    /**
     * input_columns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getInputColumns();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#catalog QuicksightDataSet#catalog}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalog() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#schema QuicksightDataSet#schema}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchema() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetPhysicalTableMapRelationalTable}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetPhysicalTableMapRelationalTable}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetPhysicalTableMapRelationalTable> {
        java.lang.String dataSourceArn;
        java.lang.Object inputColumns;
        java.lang.String name;
        java.lang.String catalog;
        java.lang.String schema;

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapRelationalTable#getDataSourceArn}
         * @param dataSourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSourceArn(java.lang.String dataSourceArn) {
            this.dataSourceArn = dataSourceArn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapRelationalTable#getInputColumns}
         * @param inputColumns input_columns block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
         * @return {@code this}
         */
        public Builder inputColumns(com.hashicorp.cdktf.IResolvable inputColumns) {
            this.inputColumns = inputColumns;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapRelationalTable#getInputColumns}
         * @param inputColumns input_columns block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
         * @return {@code this}
         */
        public Builder inputColumns(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableInputColumns> inputColumns) {
            this.inputColumns = inputColumns;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapRelationalTable#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapRelationalTable#getCatalog}
         * @param catalog Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#catalog QuicksightDataSet#catalog}.
         * @return {@code this}
         */
        public Builder catalog(java.lang.String catalog) {
            this.catalog = catalog;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapRelationalTable#getSchema}
         * @param schema Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#schema QuicksightDataSet#schema}.
         * @return {@code this}
         */
        public Builder schema(java.lang.String schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetPhysicalTableMapRelationalTable}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetPhysicalTableMapRelationalTable build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetPhysicalTableMapRelationalTable}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetPhysicalTableMapRelationalTable {
        private final java.lang.String dataSourceArn;
        private final java.lang.Object inputColumns;
        private final java.lang.String name;
        private final java.lang.String catalog;
        private final java.lang.String schema;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSourceArn = software.amazon.jsii.Kernel.get(this, "dataSourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputColumns = software.amazon.jsii.Kernel.get(this, "inputColumns", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalog = software.amazon.jsii.Kernel.get(this, "catalog", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schema = software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSourceArn = java.util.Objects.requireNonNull(builder.dataSourceArn, "dataSourceArn is required");
            this.inputColumns = java.util.Objects.requireNonNull(builder.inputColumns, "inputColumns is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.catalog = builder.catalog;
            this.schema = builder.schema;
        }

        @Override
        public final java.lang.String getDataSourceArn() {
            return this.dataSourceArn;
        }

        @Override
        public final java.lang.Object getInputColumns() {
            return this.inputColumns;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getCatalog() {
            return this.catalog;
        }

        @Override
        public final java.lang.String getSchema() {
            return this.schema;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataSourceArn", om.valueToTree(this.getDataSourceArn()));
            data.set("inputColumns", om.valueToTree(this.getInputColumns()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCatalog() != null) {
                data.set("catalog", om.valueToTree(this.getCatalog()));
            }
            if (this.getSchema() != null) {
                data.set("schema", om.valueToTree(this.getSchema()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapRelationalTable"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetPhysicalTableMapRelationalTable.Jsii$Proxy that = (QuicksightDataSetPhysicalTableMapRelationalTable.Jsii$Proxy) o;

            if (!dataSourceArn.equals(that.dataSourceArn)) return false;
            if (!inputColumns.equals(that.inputColumns)) return false;
            if (!name.equals(that.name)) return false;
            if (this.catalog != null ? !this.catalog.equals(that.catalog) : that.catalog != null) return false;
            return this.schema != null ? this.schema.equals(that.schema) : that.schema == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataSourceArn.hashCode();
            result = 31 * result + (this.inputColumns.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.catalog != null ? this.catalog.hashCode() : 0);
            result = 31 * result + (this.schema != null ? this.schema.hashCode() : 0);
            return result;
        }
    }
}
