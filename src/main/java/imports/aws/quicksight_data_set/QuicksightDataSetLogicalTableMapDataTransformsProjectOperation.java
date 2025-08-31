package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.107Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapDataTransformsProjectOperation.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapDataTransformsProjectOperation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#projected_columns QuicksightDataSet#projected_columns}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getProjectedColumns();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapDataTransformsProjectOperation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapDataTransformsProjectOperation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapDataTransformsProjectOperation> {
        java.util.List<java.lang.String> projectedColumns;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsProjectOperation#getProjectedColumns}
         * @param projectedColumns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#projected_columns QuicksightDataSet#projected_columns}. This parameter is required.
         * @return {@code this}
         */
        public Builder projectedColumns(java.util.List<java.lang.String> projectedColumns) {
            this.projectedColumns = projectedColumns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapDataTransformsProjectOperation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapDataTransformsProjectOperation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapDataTransformsProjectOperation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapDataTransformsProjectOperation {
        private final java.util.List<java.lang.String> projectedColumns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.projectedColumns = software.amazon.jsii.Kernel.get(this, "projectedColumns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.projectedColumns = java.util.Objects.requireNonNull(builder.projectedColumns, "projectedColumns is required");
        }

        @Override
        public final java.util.List<java.lang.String> getProjectedColumns() {
            return this.projectedColumns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("projectedColumns", om.valueToTree(this.getProjectedColumns()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapDataTransformsProjectOperation.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapDataTransformsProjectOperation.Jsii$Proxy) o;

            return this.projectedColumns.equals(that.projectedColumns);
        }

        @Override
        public final int hashCode() {
            int result = this.projectedColumns.hashCode();
            return result;
        }
    }
}
