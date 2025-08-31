package imports.aws.globalaccelerator_custom_routing_endpoint_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.275Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorCustomRoutingEndpointGroup.GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration.Jsii$Proxy.class)
public interface GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#endpoint_id GlobalacceleratorCustomRoutingEndpointGroup#endpoint_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration> {
        java.lang.String endpointId;

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration#getEndpointId}
         * @param endpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#endpoint_id GlobalacceleratorCustomRoutingEndpointGroup#endpoint_id}.
         * @return {@code this}
         */
        public Builder endpointId(java.lang.String endpointId) {
            this.endpointId = endpointId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration {
        private final java.lang.String endpointId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endpointId = software.amazon.jsii.Kernel.get(this, "endpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endpointId = builder.endpointId;
        }

        @Override
        public final java.lang.String getEndpointId() {
            return this.endpointId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEndpointId() != null) {
                data.set("endpointId", om.valueToTree(this.getEndpointId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.globalacceleratorCustomRoutingEndpointGroup.GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration.Jsii$Proxy that = (GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration.Jsii$Proxy) o;

            return this.endpointId != null ? this.endpointId.equals(that.endpointId) : that.endpointId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.endpointId != null ? this.endpointId.hashCode() : 0;
            return result;
        }
    }
}
