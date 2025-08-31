package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableOnDemandThroughput")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableOnDemandThroughput.Jsii$Proxy.class)
public interface DynamodbTableOnDemandThroughput extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#max_read_request_units DynamodbTable#max_read_request_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxReadRequestUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#max_write_request_units DynamodbTable#max_write_request_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxWriteRequestUnits() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableOnDemandThroughput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableOnDemandThroughput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableOnDemandThroughput> {
        java.lang.Number maxReadRequestUnits;
        java.lang.Number maxWriteRequestUnits;

        /**
         * Sets the value of {@link DynamodbTableOnDemandThroughput#getMaxReadRequestUnits}
         * @param maxReadRequestUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#max_read_request_units DynamodbTable#max_read_request_units}.
         * @return {@code this}
         */
        public Builder maxReadRequestUnits(java.lang.Number maxReadRequestUnits) {
            this.maxReadRequestUnits = maxReadRequestUnits;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableOnDemandThroughput#getMaxWriteRequestUnits}
         * @param maxWriteRequestUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#max_write_request_units DynamodbTable#max_write_request_units}.
         * @return {@code this}
         */
        public Builder maxWriteRequestUnits(java.lang.Number maxWriteRequestUnits) {
            this.maxWriteRequestUnits = maxWriteRequestUnits;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTableOnDemandThroughput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableOnDemandThroughput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableOnDemandThroughput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableOnDemandThroughput {
        private final java.lang.Number maxReadRequestUnits;
        private final java.lang.Number maxWriteRequestUnits;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxReadRequestUnits = software.amazon.jsii.Kernel.get(this, "maxReadRequestUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxWriteRequestUnits = software.amazon.jsii.Kernel.get(this, "maxWriteRequestUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxReadRequestUnits = builder.maxReadRequestUnits;
            this.maxWriteRequestUnits = builder.maxWriteRequestUnits;
        }

        @Override
        public final java.lang.Number getMaxReadRequestUnits() {
            return this.maxReadRequestUnits;
        }

        @Override
        public final java.lang.Number getMaxWriteRequestUnits() {
            return this.maxWriteRequestUnits;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxReadRequestUnits() != null) {
                data.set("maxReadRequestUnits", om.valueToTree(this.getMaxReadRequestUnits()));
            }
            if (this.getMaxWriteRequestUnits() != null) {
                data.set("maxWriteRequestUnits", om.valueToTree(this.getMaxWriteRequestUnits()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTableOnDemandThroughput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableOnDemandThroughput.Jsii$Proxy that = (DynamodbTableOnDemandThroughput.Jsii$Proxy) o;

            if (this.maxReadRequestUnits != null ? !this.maxReadRequestUnits.equals(that.maxReadRequestUnits) : that.maxReadRequestUnits != null) return false;
            return this.maxWriteRequestUnits != null ? this.maxWriteRequestUnits.equals(that.maxWriteRequestUnits) : that.maxWriteRequestUnits == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxReadRequestUnits != null ? this.maxReadRequestUnits.hashCode() : 0;
            result = 31 * result + (this.maxWriteRequestUnits != null ? this.maxWriteRequestUnits.hashCode() : 0);
            return result;
        }
    }
}
