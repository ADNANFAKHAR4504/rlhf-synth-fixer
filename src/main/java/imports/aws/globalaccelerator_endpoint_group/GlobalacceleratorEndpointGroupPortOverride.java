package imports.aws.globalaccelerator_endpoint_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.276Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorEndpointGroup.GlobalacceleratorEndpointGroupPortOverride")
@software.amazon.jsii.Jsii.Proxy(GlobalacceleratorEndpointGroupPortOverride.Jsii$Proxy.class)
public interface GlobalacceleratorEndpointGroupPortOverride extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#endpoint_port GlobalacceleratorEndpointGroup#endpoint_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getEndpointPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#listener_port GlobalacceleratorEndpointGroup#listener_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getListenerPort();

    /**
     * @return a {@link Builder} of {@link GlobalacceleratorEndpointGroupPortOverride}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlobalacceleratorEndpointGroupPortOverride}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlobalacceleratorEndpointGroupPortOverride> {
        java.lang.Number endpointPort;
        java.lang.Number listenerPort;

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupPortOverride#getEndpointPort}
         * @param endpointPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#endpoint_port GlobalacceleratorEndpointGroup#endpoint_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpointPort(java.lang.Number endpointPort) {
            this.endpointPort = endpointPort;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupPortOverride#getListenerPort}
         * @param listenerPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#listener_port GlobalacceleratorEndpointGroup#listener_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder listenerPort(java.lang.Number listenerPort) {
            this.listenerPort = listenerPort;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlobalacceleratorEndpointGroupPortOverride}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlobalacceleratorEndpointGroupPortOverride build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlobalacceleratorEndpointGroupPortOverride}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlobalacceleratorEndpointGroupPortOverride {
        private final java.lang.Number endpointPort;
        private final java.lang.Number listenerPort;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endpointPort = software.amazon.jsii.Kernel.get(this, "endpointPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.listenerPort = software.amazon.jsii.Kernel.get(this, "listenerPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endpointPort = java.util.Objects.requireNonNull(builder.endpointPort, "endpointPort is required");
            this.listenerPort = java.util.Objects.requireNonNull(builder.listenerPort, "listenerPort is required");
        }

        @Override
        public final java.lang.Number getEndpointPort() {
            return this.endpointPort;
        }

        @Override
        public final java.lang.Number getListenerPort() {
            return this.listenerPort;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("endpointPort", om.valueToTree(this.getEndpointPort()));
            data.set("listenerPort", om.valueToTree(this.getListenerPort()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.globalacceleratorEndpointGroup.GlobalacceleratorEndpointGroupPortOverride"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlobalacceleratorEndpointGroupPortOverride.Jsii$Proxy that = (GlobalacceleratorEndpointGroupPortOverride.Jsii$Proxy) o;

            if (!endpointPort.equals(that.endpointPort)) return false;
            return this.listenerPort.equals(that.listenerPort);
        }

        @Override
        public final int hashCode() {
            int result = this.endpointPort.hashCode();
            result = 31 * result + (this.listenerPort.hashCode());
            return result;
        }
    }
}
