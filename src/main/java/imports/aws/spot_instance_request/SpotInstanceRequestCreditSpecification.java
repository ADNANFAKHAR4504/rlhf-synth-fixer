package imports.aws.spot_instance_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.488Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotInstanceRequest.SpotInstanceRequestCreditSpecification")
@software.amazon.jsii.Jsii.Proxy(SpotInstanceRequestCreditSpecification.Jsii$Proxy.class)
public interface SpotInstanceRequestCreditSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_credits SpotInstanceRequest#cpu_credits}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCpuCredits() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SpotInstanceRequestCreditSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SpotInstanceRequestCreditSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SpotInstanceRequestCreditSpecification> {
        java.lang.String cpuCredits;

        /**
         * Sets the value of {@link SpotInstanceRequestCreditSpecification#getCpuCredits}
         * @param cpuCredits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_credits SpotInstanceRequest#cpu_credits}.
         * @return {@code this}
         */
        public Builder cpuCredits(java.lang.String cpuCredits) {
            this.cpuCredits = cpuCredits;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SpotInstanceRequestCreditSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SpotInstanceRequestCreditSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SpotInstanceRequestCreditSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SpotInstanceRequestCreditSpecification {
        private final java.lang.String cpuCredits;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cpuCredits = software.amazon.jsii.Kernel.get(this, "cpuCredits", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cpuCredits = builder.cpuCredits;
        }

        @Override
        public final java.lang.String getCpuCredits() {
            return this.cpuCredits;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCpuCredits() != null) {
                data.set("cpuCredits", om.valueToTree(this.getCpuCredits()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.spotInstanceRequest.SpotInstanceRequestCreditSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SpotInstanceRequestCreditSpecification.Jsii$Proxy that = (SpotInstanceRequestCreditSpecification.Jsii$Proxy) o;

            return this.cpuCredits != null ? this.cpuCredits.equals(that.cpuCredits) : that.cpuCredits == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cpuCredits != null ? this.cpuCredits.hashCode() : 0;
            return result;
        }
    }
}
