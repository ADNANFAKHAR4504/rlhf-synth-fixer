package imports.aws.lightsail_instance_public_ports;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.829Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailInstancePublicPorts.LightsailInstancePublicPortsPortInfo")
@software.amazon.jsii.Jsii.Proxy(LightsailInstancePublicPortsPortInfo.Jsii$Proxy.class)
public interface LightsailInstancePublicPortsPortInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#from_port LightsailInstancePublicPorts#from_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFromPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#protocol LightsailInstancePublicPorts#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#to_port LightsailInstancePublicPorts#to_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getToPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#cidr_list_aliases LightsailInstancePublicPorts#cidr_list_aliases}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCidrListAliases() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#cidrs LightsailInstancePublicPorts#cidrs}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCidrs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#ipv6_cidrs LightsailInstancePublicPorts#ipv6_cidrs}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6Cidrs() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailInstancePublicPortsPortInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailInstancePublicPortsPortInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailInstancePublicPortsPortInfo> {
        java.lang.Number fromPort;
        java.lang.String protocol;
        java.lang.Number toPort;
        java.util.List<java.lang.String> cidrListAliases;
        java.util.List<java.lang.String> cidrs;
        java.util.List<java.lang.String> ipv6Cidrs;

        /**
         * Sets the value of {@link LightsailInstancePublicPortsPortInfo#getFromPort}
         * @param fromPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#from_port LightsailInstancePublicPorts#from_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder fromPort(java.lang.Number fromPort) {
            this.fromPort = fromPort;
            return this;
        }

        /**
         * Sets the value of {@link LightsailInstancePublicPortsPortInfo#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#protocol LightsailInstancePublicPorts#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link LightsailInstancePublicPortsPortInfo#getToPort}
         * @param toPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#to_port LightsailInstancePublicPorts#to_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder toPort(java.lang.Number toPort) {
            this.toPort = toPort;
            return this;
        }

        /**
         * Sets the value of {@link LightsailInstancePublicPortsPortInfo#getCidrListAliases}
         * @param cidrListAliases Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#cidr_list_aliases LightsailInstancePublicPorts#cidr_list_aliases}.
         * @return {@code this}
         */
        public Builder cidrListAliases(java.util.List<java.lang.String> cidrListAliases) {
            this.cidrListAliases = cidrListAliases;
            return this;
        }

        /**
         * Sets the value of {@link LightsailInstancePublicPortsPortInfo#getCidrs}
         * @param cidrs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#cidrs LightsailInstancePublicPorts#cidrs}.
         * @return {@code this}
         */
        public Builder cidrs(java.util.List<java.lang.String> cidrs) {
            this.cidrs = cidrs;
            return this;
        }

        /**
         * Sets the value of {@link LightsailInstancePublicPortsPortInfo#getIpv6Cidrs}
         * @param ipv6Cidrs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance_public_ports#ipv6_cidrs LightsailInstancePublicPorts#ipv6_cidrs}.
         * @return {@code this}
         */
        public Builder ipv6Cidrs(java.util.List<java.lang.String> ipv6Cidrs) {
            this.ipv6Cidrs = ipv6Cidrs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailInstancePublicPortsPortInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailInstancePublicPortsPortInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailInstancePublicPortsPortInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailInstancePublicPortsPortInfo {
        private final java.lang.Number fromPort;
        private final java.lang.String protocol;
        private final java.lang.Number toPort;
        private final java.util.List<java.lang.String> cidrListAliases;
        private final java.util.List<java.lang.String> cidrs;
        private final java.util.List<java.lang.String> ipv6Cidrs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fromPort = software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.toPort = software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cidrListAliases = software.amazon.jsii.Kernel.get(this, "cidrListAliases", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cidrs = software.amazon.jsii.Kernel.get(this, "cidrs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipv6Cidrs = software.amazon.jsii.Kernel.get(this, "ipv6Cidrs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fromPort = java.util.Objects.requireNonNull(builder.fromPort, "fromPort is required");
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.toPort = java.util.Objects.requireNonNull(builder.toPort, "toPort is required");
            this.cidrListAliases = builder.cidrListAliases;
            this.cidrs = builder.cidrs;
            this.ipv6Cidrs = builder.ipv6Cidrs;
        }

        @Override
        public final java.lang.Number getFromPort() {
            return this.fromPort;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.Number getToPort() {
            return this.toPort;
        }

        @Override
        public final java.util.List<java.lang.String> getCidrListAliases() {
            return this.cidrListAliases;
        }

        @Override
        public final java.util.List<java.lang.String> getCidrs() {
            return this.cidrs;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv6Cidrs() {
            return this.ipv6Cidrs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fromPort", om.valueToTree(this.getFromPort()));
            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("toPort", om.valueToTree(this.getToPort()));
            if (this.getCidrListAliases() != null) {
                data.set("cidrListAliases", om.valueToTree(this.getCidrListAliases()));
            }
            if (this.getCidrs() != null) {
                data.set("cidrs", om.valueToTree(this.getCidrs()));
            }
            if (this.getIpv6Cidrs() != null) {
                data.set("ipv6Cidrs", om.valueToTree(this.getIpv6Cidrs()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailInstancePublicPorts.LightsailInstancePublicPortsPortInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailInstancePublicPortsPortInfo.Jsii$Proxy that = (LightsailInstancePublicPortsPortInfo.Jsii$Proxy) o;

            if (!fromPort.equals(that.fromPort)) return false;
            if (!protocol.equals(that.protocol)) return false;
            if (!toPort.equals(that.toPort)) return false;
            if (this.cidrListAliases != null ? !this.cidrListAliases.equals(that.cidrListAliases) : that.cidrListAliases != null) return false;
            if (this.cidrs != null ? !this.cidrs.equals(that.cidrs) : that.cidrs != null) return false;
            return this.ipv6Cidrs != null ? this.ipv6Cidrs.equals(that.ipv6Cidrs) : that.ipv6Cidrs == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fromPort.hashCode();
            result = 31 * result + (this.protocol.hashCode());
            result = 31 * result + (this.toPort.hashCode());
            result = 31 * result + (this.cidrListAliases != null ? this.cidrListAliases.hashCode() : 0);
            result = 31 * result + (this.cidrs != null ? this.cidrs.hashCode() : 0);
            result = 31 * result + (this.ipv6Cidrs != null ? this.ipv6Cidrs.hashCode() : 0);
            return result;
        }
    }
}
