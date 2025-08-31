package imports.aws.ses_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.446Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesConfigurationSet.SesConfigurationSetDeliveryOptions")
@software.amazon.jsii.Jsii.Proxy(SesConfigurationSetDeliveryOptions.Jsii$Proxy.class)
public interface SesConfigurationSetDeliveryOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#tls_policy SesConfigurationSet#tls_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTlsPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SesConfigurationSetDeliveryOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesConfigurationSetDeliveryOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesConfigurationSetDeliveryOptions> {
        java.lang.String tlsPolicy;

        /**
         * Sets the value of {@link SesConfigurationSetDeliveryOptions#getTlsPolicy}
         * @param tlsPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_configuration_set#tls_policy SesConfigurationSet#tls_policy}.
         * @return {@code this}
         */
        public Builder tlsPolicy(java.lang.String tlsPolicy) {
            this.tlsPolicy = tlsPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SesConfigurationSetDeliveryOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesConfigurationSetDeliveryOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesConfigurationSetDeliveryOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesConfigurationSetDeliveryOptions {
        private final java.lang.String tlsPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tlsPolicy = software.amazon.jsii.Kernel.get(this, "tlsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tlsPolicy = builder.tlsPolicy;
        }

        @Override
        public final java.lang.String getTlsPolicy() {
            return this.tlsPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTlsPolicy() != null) {
                data.set("tlsPolicy", om.valueToTree(this.getTlsPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesConfigurationSet.SesConfigurationSetDeliveryOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesConfigurationSetDeliveryOptions.Jsii$Proxy that = (SesConfigurationSetDeliveryOptions.Jsii$Proxy) o;

            return this.tlsPolicy != null ? this.tlsPolicy.equals(that.tlsPolicy) : that.tlsPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tlsPolicy != null ? this.tlsPolicy.hashCode() : 0;
            return result;
        }
    }
}
