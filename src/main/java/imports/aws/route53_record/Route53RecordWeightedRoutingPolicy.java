package imports.aws.route53_record;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53Record.Route53RecordWeightedRoutingPolicy")
@software.amazon.jsii.Jsii.Proxy(Route53RecordWeightedRoutingPolicy.Jsii$Proxy.class)
public interface Route53RecordWeightedRoutingPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#weight Route53Record#weight}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWeight();

    /**
     * @return a {@link Builder} of {@link Route53RecordWeightedRoutingPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecordWeightedRoutingPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecordWeightedRoutingPolicy> {
        java.lang.Number weight;

        /**
         * Sets the value of {@link Route53RecordWeightedRoutingPolicy#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#weight Route53Record#weight}. This parameter is required.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecordWeightedRoutingPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecordWeightedRoutingPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecordWeightedRoutingPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecordWeightedRoutingPolicy {
        private final java.lang.Number weight;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.weight = java.util.Objects.requireNonNull(builder.weight, "weight is required");
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("weight", om.valueToTree(this.getWeight()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53Record.Route53RecordWeightedRoutingPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecordWeightedRoutingPolicy.Jsii$Proxy that = (Route53RecordWeightedRoutingPolicy.Jsii$Proxy) o;

            return this.weight.equals(that.weight);
        }

        @Override
        public final int hashCode() {
            int result = this.weight.hashCode();
            return result;
        }
    }
}
