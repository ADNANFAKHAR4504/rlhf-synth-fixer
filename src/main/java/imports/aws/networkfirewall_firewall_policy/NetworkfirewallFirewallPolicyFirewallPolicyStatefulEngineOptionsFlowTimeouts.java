package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts.Jsii$Proxy.class)
public interface NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#tcp_idle_timeout_seconds NetworkfirewallFirewallPolicy#tcp_idle_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTcpIdleTimeoutSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts> {
        java.lang.Number tcpIdleTimeoutSeconds;

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts#getTcpIdleTimeoutSeconds}
         * @param tcpIdleTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#tcp_idle_timeout_seconds NetworkfirewallFirewallPolicy#tcp_idle_timeout_seconds}.
         * @return {@code this}
         */
        public Builder tcpIdleTimeoutSeconds(java.lang.Number tcpIdleTimeoutSeconds) {
            this.tcpIdleTimeoutSeconds = tcpIdleTimeoutSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts {
        private final java.lang.Number tcpIdleTimeoutSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tcpIdleTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "tcpIdleTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tcpIdleTimeoutSeconds = builder.tcpIdleTimeoutSeconds;
        }

        @Override
        public final java.lang.Number getTcpIdleTimeoutSeconds() {
            return this.tcpIdleTimeoutSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTcpIdleTimeoutSeconds() != null) {
                data.set("tcpIdleTimeoutSeconds", om.valueToTree(this.getTcpIdleTimeoutSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts.Jsii$Proxy that = (NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts.Jsii$Proxy) o;

            return this.tcpIdleTimeoutSeconds != null ? this.tcpIdleTimeoutSeconds.equals(that.tcpIdleTimeoutSeconds) : that.tcpIdleTimeoutSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tcpIdleTimeoutSeconds != null ? this.tcpIdleTimeoutSeconds.hashCode() : 0;
            return result;
        }
    }
}
