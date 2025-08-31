package imports.aws.verifiedaccess_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.573Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessEndpoint.VerifiedaccessEndpointNetworkInterfaceOptions")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessEndpointNetworkInterfaceOptions.Jsii$Proxy.class)
public interface VerifiedaccessEndpointNetworkInterfaceOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#network_interface_id VerifiedaccessEndpoint#network_interface_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port VerifiedaccessEndpoint#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * port_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port_range VerifiedaccessEndpoint#port_range}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPortRange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#protocol VerifiedaccessEndpoint#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessEndpointNetworkInterfaceOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessEndpointNetworkInterfaceOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessEndpointNetworkInterfaceOptions> {
        java.lang.String networkInterfaceId;
        java.lang.Number port;
        java.lang.Object portRange;
        java.lang.String protocol;

        /**
         * Sets the value of {@link VerifiedaccessEndpointNetworkInterfaceOptions#getNetworkInterfaceId}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#network_interface_id VerifiedaccessEndpoint#network_interface_id}.
         * @return {@code this}
         */
        public Builder networkInterfaceId(java.lang.String networkInterfaceId) {
            this.networkInterfaceId = networkInterfaceId;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointNetworkInterfaceOptions#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port VerifiedaccessEndpoint#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointNetworkInterfaceOptions#getPortRange}
         * @param portRange port_range block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port_range VerifiedaccessEndpoint#port_range}
         * @return {@code this}
         */
        public Builder portRange(com.hashicorp.cdktf.IResolvable portRange) {
            this.portRange = portRange;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointNetworkInterfaceOptions#getPortRange}
         * @param portRange port_range block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port_range VerifiedaccessEndpoint#port_range}
         * @return {@code this}
         */
        public Builder portRange(java.util.List<? extends imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptionsPortRange> portRange) {
            this.portRange = portRange;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointNetworkInterfaceOptions#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#protocol VerifiedaccessEndpoint#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessEndpointNetworkInterfaceOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessEndpointNetworkInterfaceOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessEndpointNetworkInterfaceOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessEndpointNetworkInterfaceOptions {
        private final java.lang.String networkInterfaceId;
        private final java.lang.Number port;
        private final java.lang.Object portRange;
        private final java.lang.String protocol;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.networkInterfaceId = software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.portRange = software.amazon.jsii.Kernel.get(this, "portRange", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.networkInterfaceId = builder.networkInterfaceId;
            this.port = builder.port;
            this.portRange = builder.portRange;
            this.protocol = builder.protocol;
        }

        @Override
        public final java.lang.String getNetworkInterfaceId() {
            return this.networkInterfaceId;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.Object getPortRange() {
            return this.portRange;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNetworkInterfaceId() != null) {
                data.set("networkInterfaceId", om.valueToTree(this.getNetworkInterfaceId()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPortRange() != null) {
                data.set("portRange", om.valueToTree(this.getPortRange()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessEndpoint.VerifiedaccessEndpointNetworkInterfaceOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessEndpointNetworkInterfaceOptions.Jsii$Proxy that = (VerifiedaccessEndpointNetworkInterfaceOptions.Jsii$Proxy) o;

            if (this.networkInterfaceId != null ? !this.networkInterfaceId.equals(that.networkInterfaceId) : that.networkInterfaceId != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.portRange != null ? !this.portRange.equals(that.portRange) : that.portRange != null) return false;
            return this.protocol != null ? this.protocol.equals(that.protocol) : that.protocol == null;
        }

        @Override
        public final int hashCode() {
            int result = this.networkInterfaceId != null ? this.networkInterfaceId.hashCode() : 0;
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.portRange != null ? this.portRange.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            return result;
        }
    }
}
