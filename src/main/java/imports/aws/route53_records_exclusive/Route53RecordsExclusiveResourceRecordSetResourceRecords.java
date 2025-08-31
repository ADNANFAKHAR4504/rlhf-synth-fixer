package imports.aws.route53_records_exclusive;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.216Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetResourceRecords")
@software.amazon.jsii.Jsii.Proxy(Route53RecordsExclusiveResourceRecordSetResourceRecords.Jsii$Proxy.class)
public interface Route53RecordsExclusiveResourceRecordSetResourceRecords extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#value Route53RecordsExclusive#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * @return a {@link Builder} of {@link Route53RecordsExclusiveResourceRecordSetResourceRecords}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecordsExclusiveResourceRecordSetResourceRecords}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecordsExclusiveResourceRecordSetResourceRecords> {
        java.lang.String value;

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSetResourceRecords#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#value Route53RecordsExclusive#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecordsExclusiveResourceRecordSetResourceRecords}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecordsExclusiveResourceRecordSetResourceRecords build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecordsExclusiveResourceRecordSetResourceRecords}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecordsExclusiveResourceRecordSetResourceRecords {
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("value", om.valueToTree(this.getValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetResourceRecords"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecordsExclusiveResourceRecordSetResourceRecords.Jsii$Proxy that = (Route53RecordsExclusiveResourceRecordSetResourceRecords.Jsii$Proxy) o;

            return this.value.equals(that.value);
        }

        @Override
        public final int hashCode() {
            int result = this.value.hashCode();
            return result;
        }
    }
}
