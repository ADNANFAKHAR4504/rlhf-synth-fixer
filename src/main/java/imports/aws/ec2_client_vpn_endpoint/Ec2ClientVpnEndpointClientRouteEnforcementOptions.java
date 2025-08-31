package imports.aws.ec2_client_vpn_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.073Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2ClientVpnEndpoint.Ec2ClientVpnEndpointClientRouteEnforcementOptions")
@software.amazon.jsii.Jsii.Proxy(Ec2ClientVpnEndpointClientRouteEnforcementOptions.Jsii$Proxy.class)
public interface Ec2ClientVpnEndpointClientRouteEnforcementOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#enforced Ec2ClientVpnEndpoint#enforced}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnforced() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2ClientVpnEndpointClientRouteEnforcementOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2ClientVpnEndpointClientRouteEnforcementOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2ClientVpnEndpointClientRouteEnforcementOptions> {
        java.lang.Object enforced;

        /**
         * Sets the value of {@link Ec2ClientVpnEndpointClientRouteEnforcementOptions#getEnforced}
         * @param enforced Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#enforced Ec2ClientVpnEndpoint#enforced}.
         * @return {@code this}
         */
        public Builder enforced(java.lang.Boolean enforced) {
            this.enforced = enforced;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnEndpointClientRouteEnforcementOptions#getEnforced}
         * @param enforced Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#enforced Ec2ClientVpnEndpoint#enforced}.
         * @return {@code this}
         */
        public Builder enforced(com.hashicorp.cdktf.IResolvable enforced) {
            this.enforced = enforced;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2ClientVpnEndpointClientRouteEnforcementOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2ClientVpnEndpointClientRouteEnforcementOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2ClientVpnEndpointClientRouteEnforcementOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2ClientVpnEndpointClientRouteEnforcementOptions {
        private final java.lang.Object enforced;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enforced = software.amazon.jsii.Kernel.get(this, "enforced", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enforced = builder.enforced;
        }

        @Override
        public final java.lang.Object getEnforced() {
            return this.enforced;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnforced() != null) {
                data.set("enforced", om.valueToTree(this.getEnforced()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2ClientVpnEndpoint.Ec2ClientVpnEndpointClientRouteEnforcementOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2ClientVpnEndpointClientRouteEnforcementOptions.Jsii$Proxy that = (Ec2ClientVpnEndpointClientRouteEnforcementOptions.Jsii$Proxy) o;

            return this.enforced != null ? this.enforced.equals(that.enforced) : that.enforced == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enforced != null ? this.enforced.hashCode() : 0;
            return result;
        }
    }
}
