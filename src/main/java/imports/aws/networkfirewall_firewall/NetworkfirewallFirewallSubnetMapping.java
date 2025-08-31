package imports.aws.networkfirewall_firewall;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.944Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewall.NetworkfirewallFirewallSubnetMapping")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallSubnetMapping.Jsii$Proxy.class)
public interface NetworkfirewallFirewallSubnetMapping extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#subnet_id NetworkfirewallFirewall#subnet_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSubnetId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#ip_address_type NetworkfirewallFirewall#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallSubnetMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallSubnetMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallSubnetMapping> {
        java.lang.String subnetId;
        java.lang.String ipAddressType;

        /**
         * Sets the value of {@link NetworkfirewallFirewallSubnetMapping#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#subnet_id NetworkfirewallFirewall#subnet_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallSubnetMapping#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#ip_address_type NetworkfirewallFirewall#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallSubnetMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallSubnetMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallSubnetMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallSubnetMapping {
        private final java.lang.String subnetId;
        private final java.lang.String ipAddressType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.subnetId = java.util.Objects.requireNonNull(builder.subnetId, "subnetId is required");
            this.ipAddressType = builder.ipAddressType;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("subnetId", om.valueToTree(this.getSubnetId()));
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewall.NetworkfirewallFirewallSubnetMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallSubnetMapping.Jsii$Proxy that = (NetworkfirewallFirewallSubnetMapping.Jsii$Proxy) o;

            if (!subnetId.equals(that.subnetId)) return false;
            return this.ipAddressType != null ? this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.subnetId.hashCode();
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            return result;
        }
    }
}
