package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.107Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_id QuicksightDataSet#column_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getColumnId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getColumnName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#expression QuicksightDataSet#expression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExpression();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns> {
        java.lang.String columnId;
        java.lang.String columnName;
        java.lang.String expression;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns#getColumnId}
         * @param columnId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_id QuicksightDataSet#column_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder columnId(java.lang.String columnId) {
            this.columnId = columnId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns#getColumnName}
         * @param columnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder columnName(java.lang.String columnName) {
            this.columnName = columnName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns#getExpression}
         * @param expression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#expression QuicksightDataSet#expression}. This parameter is required.
         * @return {@code this}
         */
        public Builder expression(java.lang.String expression) {
            this.expression = expression;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns {
        private final java.lang.String columnId;
        private final java.lang.String columnName;
        private final java.lang.String expression;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columnId = software.amazon.jsii.Kernel.get(this, "columnId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.columnName = software.amazon.jsii.Kernel.get(this, "columnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.expression = software.amazon.jsii.Kernel.get(this, "expression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columnId = java.util.Objects.requireNonNull(builder.columnId, "columnId is required");
            this.columnName = java.util.Objects.requireNonNull(builder.columnName, "columnName is required");
            this.expression = java.util.Objects.requireNonNull(builder.expression, "expression is required");
        }

        @Override
        public final java.lang.String getColumnId() {
            return this.columnId;
        }

        @Override
        public final java.lang.String getColumnName() {
            return this.columnName;
        }

        @Override
        public final java.lang.String getExpression() {
            return this.expression;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("columnId", om.valueToTree(this.getColumnId()));
            data.set("columnName", om.valueToTree(this.getColumnName()));
            data.set("expression", om.valueToTree(this.getExpression()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns.Jsii$Proxy) o;

            if (!columnId.equals(that.columnId)) return false;
            if (!columnName.equals(that.columnName)) return false;
            return this.expression.equals(that.expression);
        }

        @Override
        public final int hashCode() {
            int result = this.columnId.hashCode();
            result = 31 * result + (this.columnName.hashCode());
            result = 31 * result + (this.expression.hashCode());
            return result;
        }
    }
}
