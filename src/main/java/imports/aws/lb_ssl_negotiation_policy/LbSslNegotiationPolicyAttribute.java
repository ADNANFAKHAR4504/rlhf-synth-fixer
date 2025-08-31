package imports.aws.lb_ssl_negotiation_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.533Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbSslNegotiationPolicy.LbSslNegotiationPolicyAttribute")
@software.amazon.jsii.Jsii.Proxy(LbSslNegotiationPolicyAttribute.Jsii$Proxy.class)
public interface LbSslNegotiationPolicyAttribute extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_ssl_negotiation_policy#name LbSslNegotiationPolicy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_ssl_negotiation_policy#value LbSslNegotiationPolicy#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * @return a {@link Builder} of {@link LbSslNegotiationPolicyAttribute}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbSslNegotiationPolicyAttribute}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbSslNegotiationPolicyAttribute> {
        java.lang.String name;
        java.lang.String value;

        /**
         * Sets the value of {@link LbSslNegotiationPolicyAttribute#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_ssl_negotiation_policy#name LbSslNegotiationPolicy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LbSslNegotiationPolicyAttribute#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_ssl_negotiation_policy#value LbSslNegotiationPolicy#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbSslNegotiationPolicyAttribute}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbSslNegotiationPolicyAttribute build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbSslNegotiationPolicyAttribute}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbSslNegotiationPolicyAttribute {
        private final java.lang.String name;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("value", om.valueToTree(this.getValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbSslNegotiationPolicy.LbSslNegotiationPolicyAttribute"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbSslNegotiationPolicyAttribute.Jsii$Proxy that = (LbSslNegotiationPolicyAttribute.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.value.equals(that.value);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.value.hashCode());
            return result;
        }
    }
}
