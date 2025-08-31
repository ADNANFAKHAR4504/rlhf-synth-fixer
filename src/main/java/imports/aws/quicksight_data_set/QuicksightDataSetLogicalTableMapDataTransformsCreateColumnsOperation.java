package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.107Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation extends software.amazon.jsii.JsiiSerializable {

    /**
     * columns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getColumns();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation> {
        java.lang.Object columns;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation#getColumns}
         * @param columns columns block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
         * @return {@code this}
         */
        public Builder columns(com.hashicorp.cdktf.IResolvable columns) {
            this.columns = columns;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation#getColumns}
         * @param columns columns block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}
         * @return {@code this}
         */
        public Builder columns(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationColumns> columns) {
            this.columns = columns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation {
        private final java.lang.Object columns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columns = software.amazon.jsii.Kernel.get(this, "columns", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columns = java.util.Objects.requireNonNull(builder.columns, "columns is required");
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

            data.set("columns", om.valueToTree(this.getColumns()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation.Jsii$Proxy) o;

            return this.columns.equals(that.columns);
        }

        @Override
        public final int hashCode() {
            int result = this.columns.hashCode();
            return result;
        }
    }
}
