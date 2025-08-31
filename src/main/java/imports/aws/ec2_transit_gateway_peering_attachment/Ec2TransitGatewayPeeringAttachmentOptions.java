package imports.aws.ec2_transit_gateway_peering_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGatewayPeeringAttachment.Ec2TransitGatewayPeeringAttachmentOptions")
@software.amazon.jsii.Jsii.Proxy(Ec2TransitGatewayPeeringAttachmentOptions.Jsii$Proxy.class)
public interface Ec2TransitGatewayPeeringAttachmentOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#dynamic_routing Ec2TransitGatewayPeeringAttachment#dynamic_routing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDynamicRouting() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2TransitGatewayPeeringAttachmentOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2TransitGatewayPeeringAttachmentOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2TransitGatewayPeeringAttachmentOptions> {
        java.lang.String dynamicRouting;

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentOptions#getDynamicRouting}
         * @param dynamicRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#dynamic_routing Ec2TransitGatewayPeeringAttachment#dynamic_routing}.
         * @return {@code this}
         */
        public Builder dynamicRouting(java.lang.String dynamicRouting) {
            this.dynamicRouting = dynamicRouting;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2TransitGatewayPeeringAttachmentOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2TransitGatewayPeeringAttachmentOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2TransitGatewayPeeringAttachmentOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2TransitGatewayPeeringAttachmentOptions {
        private final java.lang.String dynamicRouting;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dynamicRouting = software.amazon.jsii.Kernel.get(this, "dynamicRouting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dynamicRouting = builder.dynamicRouting;
        }

        @Override
        public final java.lang.String getDynamicRouting() {
            return this.dynamicRouting;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDynamicRouting() != null) {
                data.set("dynamicRouting", om.valueToTree(this.getDynamicRouting()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2TransitGatewayPeeringAttachment.Ec2TransitGatewayPeeringAttachmentOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2TransitGatewayPeeringAttachmentOptions.Jsii$Proxy that = (Ec2TransitGatewayPeeringAttachmentOptions.Jsii$Proxy) o;

            return this.dynamicRouting != null ? this.dynamicRouting.equals(that.dynamicRouting) : that.dynamicRouting == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dynamicRouting != null ? this.dynamicRouting.hashCode() : 0;
            return result;
        }
    }
}
