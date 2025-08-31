package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateNetworkInterfacesConnectionTrackingSpecification.Jsii$Proxy.class)
public interface LaunchTemplateNetworkInterfacesConnectionTrackingSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tcp_established_timeout LaunchTemplate#tcp_established_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTcpEstablishedTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#udp_stream_timeout LaunchTemplate#udp_stream_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUdpStreamTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#udp_timeout LaunchTemplate#udp_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUdpTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplateNetworkInterfacesConnectionTrackingSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateNetworkInterfacesConnectionTrackingSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateNetworkInterfacesConnectionTrackingSpecification> {
        java.lang.Number tcpEstablishedTimeout;
        java.lang.Number udpStreamTimeout;
        java.lang.Number udpTimeout;

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfacesConnectionTrackingSpecification#getTcpEstablishedTimeout}
         * @param tcpEstablishedTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tcp_established_timeout LaunchTemplate#tcp_established_timeout}.
         * @return {@code this}
         */
        public Builder tcpEstablishedTimeout(java.lang.Number tcpEstablishedTimeout) {
            this.tcpEstablishedTimeout = tcpEstablishedTimeout;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfacesConnectionTrackingSpecification#getUdpStreamTimeout}
         * @param udpStreamTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#udp_stream_timeout LaunchTemplate#udp_stream_timeout}.
         * @return {@code this}
         */
        public Builder udpStreamTimeout(java.lang.Number udpStreamTimeout) {
            this.udpStreamTimeout = udpStreamTimeout;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfacesConnectionTrackingSpecification#getUdpTimeout}
         * @param udpTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#udp_timeout LaunchTemplate#udp_timeout}.
         * @return {@code this}
         */
        public Builder udpTimeout(java.lang.Number udpTimeout) {
            this.udpTimeout = udpTimeout;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplateNetworkInterfacesConnectionTrackingSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateNetworkInterfacesConnectionTrackingSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateNetworkInterfacesConnectionTrackingSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateNetworkInterfacesConnectionTrackingSpecification {
        private final java.lang.Number tcpEstablishedTimeout;
        private final java.lang.Number udpStreamTimeout;
        private final java.lang.Number udpTimeout;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tcpEstablishedTimeout = software.amazon.jsii.Kernel.get(this, "tcpEstablishedTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.udpStreamTimeout = software.amazon.jsii.Kernel.get(this, "udpStreamTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.udpTimeout = software.amazon.jsii.Kernel.get(this, "udpTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tcpEstablishedTimeout = builder.tcpEstablishedTimeout;
            this.udpStreamTimeout = builder.udpStreamTimeout;
            this.udpTimeout = builder.udpTimeout;
        }

        @Override
        public final java.lang.Number getTcpEstablishedTimeout() {
            return this.tcpEstablishedTimeout;
        }

        @Override
        public final java.lang.Number getUdpStreamTimeout() {
            return this.udpStreamTimeout;
        }

        @Override
        public final java.lang.Number getUdpTimeout() {
            return this.udpTimeout;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTcpEstablishedTimeout() != null) {
                data.set("tcpEstablishedTimeout", om.valueToTree(this.getTcpEstablishedTimeout()));
            }
            if (this.getUdpStreamTimeout() != null) {
                data.set("udpStreamTimeout", om.valueToTree(this.getUdpStreamTimeout()));
            }
            if (this.getUdpTimeout() != null) {
                data.set("udpTimeout", om.valueToTree(this.getUdpTimeout()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateNetworkInterfacesConnectionTrackingSpecification.Jsii$Proxy that = (LaunchTemplateNetworkInterfacesConnectionTrackingSpecification.Jsii$Proxy) o;

            if (this.tcpEstablishedTimeout != null ? !this.tcpEstablishedTimeout.equals(that.tcpEstablishedTimeout) : that.tcpEstablishedTimeout != null) return false;
            if (this.udpStreamTimeout != null ? !this.udpStreamTimeout.equals(that.udpStreamTimeout) : that.udpStreamTimeout != null) return false;
            return this.udpTimeout != null ? this.udpTimeout.equals(that.udpTimeout) : that.udpTimeout == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tcpEstablishedTimeout != null ? this.tcpEstablishedTimeout.hashCode() : 0;
            result = 31 * result + (this.udpStreamTimeout != null ? this.udpStreamTimeout.hashCode() : 0);
            result = 31 * result + (this.udpTimeout != null ? this.udpTimeout.hashCode() : 0);
            return result;
        }
    }
}
