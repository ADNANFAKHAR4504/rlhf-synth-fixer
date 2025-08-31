package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.107Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapDataTransformsFilterOperation.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapDataTransformsFilterOperation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#condition_expression QuicksightDataSet#condition_expression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConditionExpression();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapDataTransformsFilterOperation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapDataTransformsFilterOperation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapDataTransformsFilterOperation> {
        java.lang.String conditionExpression;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsFilterOperation#getConditionExpression}
         * @param conditionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#condition_expression QuicksightDataSet#condition_expression}. This parameter is required.
         * @return {@code this}
         */
        public Builder conditionExpression(java.lang.String conditionExpression) {
            this.conditionExpression = conditionExpression;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapDataTransformsFilterOperation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapDataTransformsFilterOperation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapDataTransformsFilterOperation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapDataTransformsFilterOperation {
        private final java.lang.String conditionExpression;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.conditionExpression = software.amazon.jsii.Kernel.get(this, "conditionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.conditionExpression = java.util.Objects.requireNonNull(builder.conditionExpression, "conditionExpression is required");
        }

        @Override
        public final java.lang.String getConditionExpression() {
            return this.conditionExpression;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("conditionExpression", om.valueToTree(this.getConditionExpression()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapDataTransformsFilterOperation.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapDataTransformsFilterOperation.Jsii$Proxy) o;

            return this.conditionExpression.equals(that.conditionExpression);
        }

        @Override
        public final int hashCode() {
            int result = this.conditionExpression.hashCode();
            return result;
        }
    }
}
