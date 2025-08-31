package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleActionFixedResponse")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerRuleActionFixedResponse.Jsii$Proxy.class)
public interface VpclatticeListenerRuleActionFixedResponse extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#status_code VpclatticeListenerRule#status_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getStatusCode();

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerRuleActionFixedResponse}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerRuleActionFixedResponse}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerRuleActionFixedResponse> {
        java.lang.Number statusCode;

        /**
         * Sets the value of {@link VpclatticeListenerRuleActionFixedResponse#getStatusCode}
         * @param statusCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#status_code VpclatticeListenerRule#status_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder statusCode(java.lang.Number statusCode) {
            this.statusCode = statusCode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerRuleActionFixedResponse}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerRuleActionFixedResponse build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerRuleActionFixedResponse}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerRuleActionFixedResponse {
        private final java.lang.Number statusCode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.statusCode = software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.statusCode = java.util.Objects.requireNonNull(builder.statusCode, "statusCode is required");
        }

        @Override
        public final java.lang.Number getStatusCode() {
            return this.statusCode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("statusCode", om.valueToTree(this.getStatusCode()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListenerRule.VpclatticeListenerRuleActionFixedResponse"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerRuleActionFixedResponse.Jsii$Proxy that = (VpclatticeListenerRuleActionFixedResponse.Jsii$Proxy) o;

            return this.statusCode.equals(that.statusCode);
        }

        @Override
        public final int hashCode() {
            int result = this.statusCode.hashCode();
            return result;
        }
    }
}
