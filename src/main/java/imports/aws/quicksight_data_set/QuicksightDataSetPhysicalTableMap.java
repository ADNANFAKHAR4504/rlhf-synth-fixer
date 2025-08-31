package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMap")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetPhysicalTableMap.Jsii$Proxy.class)
public interface QuicksightDataSetPhysicalTableMap extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map_id QuicksightDataSet#physical_table_map_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPhysicalTableMapId();

    /**
     * custom_sql block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#custom_sql QuicksightDataSet#custom_sql}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql getCustomSql() {
        return null;
    }

    /**
     * relational_table block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#relational_table QuicksightDataSet#relational_table}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable getRelationalTable() {
        return null;
    }

    /**
     * s3_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#s3_source QuicksightDataSet#s3_source}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source getS3Source() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetPhysicalTableMap}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetPhysicalTableMap}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetPhysicalTableMap> {
        java.lang.String physicalTableMapId;
        imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql customSql;
        imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable relationalTable;
        imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source s3Source;

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMap#getPhysicalTableMapId}
         * @param physicalTableMapId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map_id QuicksightDataSet#physical_table_map_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder physicalTableMapId(java.lang.String physicalTableMapId) {
            this.physicalTableMapId = physicalTableMapId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMap#getCustomSql}
         * @param customSql custom_sql block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#custom_sql QuicksightDataSet#custom_sql}
         * @return {@code this}
         */
        public Builder customSql(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql customSql) {
            this.customSql = customSql;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMap#getRelationalTable}
         * @param relationalTable relational_table block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#relational_table QuicksightDataSet#relational_table}
         * @return {@code this}
         */
        public Builder relationalTable(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable relationalTable) {
            this.relationalTable = relationalTable;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMap#getS3Source}
         * @param s3Source s3_source block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#s3_source QuicksightDataSet#s3_source}
         * @return {@code this}
         */
        public Builder s3Source(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source s3Source) {
            this.s3Source = s3Source;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetPhysicalTableMap}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetPhysicalTableMap build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetPhysicalTableMap}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetPhysicalTableMap {
        private final java.lang.String physicalTableMapId;
        private final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql customSql;
        private final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable relationalTable;
        private final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source s3Source;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.physicalTableMapId = software.amazon.jsii.Kernel.get(this, "physicalTableMapId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customSql = software.amazon.jsii.Kernel.get(this, "customSql", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql.class));
            this.relationalTable = software.amazon.jsii.Kernel.get(this, "relationalTable", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable.class));
            this.s3Source = software.amazon.jsii.Kernel.get(this, "s3Source", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.physicalTableMapId = java.util.Objects.requireNonNull(builder.physicalTableMapId, "physicalTableMapId is required");
            this.customSql = builder.customSql;
            this.relationalTable = builder.relationalTable;
            this.s3Source = builder.s3Source;
        }

        @Override
        public final java.lang.String getPhysicalTableMapId() {
            return this.physicalTableMapId;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql getCustomSql() {
            return this.customSql;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable getRelationalTable() {
            return this.relationalTable;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source getS3Source() {
            return this.s3Source;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("physicalTableMapId", om.valueToTree(this.getPhysicalTableMapId()));
            if (this.getCustomSql() != null) {
                data.set("customSql", om.valueToTree(this.getCustomSql()));
            }
            if (this.getRelationalTable() != null) {
                data.set("relationalTable", om.valueToTree(this.getRelationalTable()));
            }
            if (this.getS3Source() != null) {
                data.set("s3Source", om.valueToTree(this.getS3Source()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetPhysicalTableMap"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetPhysicalTableMap.Jsii$Proxy that = (QuicksightDataSetPhysicalTableMap.Jsii$Proxy) o;

            if (!physicalTableMapId.equals(that.physicalTableMapId)) return false;
            if (this.customSql != null ? !this.customSql.equals(that.customSql) : that.customSql != null) return false;
            if (this.relationalTable != null ? !this.relationalTable.equals(that.relationalTable) : that.relationalTable != null) return false;
            return this.s3Source != null ? this.s3Source.equals(that.s3Source) : that.s3Source == null;
        }

        @Override
        public final int hashCode() {
            int result = this.physicalTableMapId.hashCode();
            result = 31 * result + (this.customSql != null ? this.customSql.hashCode() : 0);
            result = 31 * result + (this.relationalTable != null ? this.relationalTable.hashCode() : 0);
            result = 31 * result + (this.s3Source != null ? this.s3Source.hashCode() : 0);
            return result;
        }
    }
}
