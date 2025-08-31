package imports.aws.globalaccelerator_custom_routing_endpoint_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.275Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorCustomRoutingEndpointGroup.GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration.Jsii$Proxy.class)
public interface GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#from_port GlobalacceleratorCustomRoutingEndpointGroup#from_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFromPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#protocols GlobalacceleratorCustomRoutingEndpointGroup#protocols}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getProtocols();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#to_port GlobalacceleratorCustomRoutingEndpointGroup#to_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getToPort();

    /**
     * @return a {@link Builder} of {@link GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration> {
        java.lang.Number fromPort;
        java.util.List<java.lang.String> protocols;
        java.lang.Number toPort;

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration#getFromPort}
         * @param fromPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#from_port GlobalacceleratorCustomRoutingEndpointGroup#from_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder fromPort(java.lang.Number fromPort) {
            this.fromPort = fromPort;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration#getProtocols}
         * @param protocols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#protocols GlobalacceleratorCustomRoutingEndpointGroup#protocols}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocols(java.util.List<java.lang.String> protocols) {
            this.protocols = protocols;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration#getToPort}
         * @param toPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#to_port GlobalacceleratorCustomRoutingEndpointGroup#to_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder toPort(java.lang.Number toPort) {
            this.toPort = toPort;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration {
        private final java.lang.Number fromPort;
        private final java.util.List<java.lang.String> protocols;
        private final java.lang.Number toPort;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fromPort = software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocols = software.amazon.jsii.Kernel.get(this, "protocols", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.toPort = software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fromPort = java.util.Objects.requireNonNull(builder.fromPort, "fromPort is required");
            this.protocols = java.util.Objects.requireNonNull(builder.protocols, "protocols is required");
            this.toPort = java.util.Objects.requireNonNull(builder.toPort, "toPort is required");
        }

        @Override
        public final java.lang.Number getFromPort() {
            return this.fromPort;
        }

        @Override
        public final java.util.List<java.lang.String> getProtocols() {
            return this.protocols;
        }

        @Override
        public final java.lang.Number getToPort() {
            return this.toPort;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fromPort", om.valueToTree(this.getFromPort()));
            data.set("protocols", om.valueToTree(this.getProtocols()));
            data.set("toPort", om.valueToTree(this.getToPort()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.globalacceleratorCustomRoutingEndpointGroup.GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration.Jsii$Proxy that = (GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration.Jsii$Proxy) o;

            if (!fromPort.equals(that.fromPort)) return false;
            if (!protocols.equals(that.protocols)) return false;
            return this.toPort.equals(that.toPort);
        }

        @Override
        public final int hashCode() {
            int result = this.fromPort.hashCode();
            result = 31 * result + (this.protocols.hashCode());
            result = 31 * result + (this.toPort.hashCode());
            return result;
        }
    }
}
