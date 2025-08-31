package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions.Jsii$Proxy.class)
public interface NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * flow_timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#flow_timeouts NetworkfirewallFirewallPolicy#flow_timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts getFlowTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#rule_order NetworkfirewallFirewallPolicy#rule_order}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRuleOrder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stream_exception_policy NetworkfirewallFirewallPolicy#stream_exception_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStreamExceptionPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions> {
        imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts flowTimeouts;
        java.lang.String ruleOrder;
        java.lang.String streamExceptionPolicy;

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions#getFlowTimeouts}
         * @param flowTimeouts flow_timeouts block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#flow_timeouts NetworkfirewallFirewallPolicy#flow_timeouts}
         * @return {@code this}
         */
        public Builder flowTimeouts(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts flowTimeouts) {
            this.flowTimeouts = flowTimeouts;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions#getRuleOrder}
         * @param ruleOrder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#rule_order NetworkfirewallFirewallPolicy#rule_order}.
         * @return {@code this}
         */
        public Builder ruleOrder(java.lang.String ruleOrder) {
            this.ruleOrder = ruleOrder;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions#getStreamExceptionPolicy}
         * @param streamExceptionPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stream_exception_policy NetworkfirewallFirewallPolicy#stream_exception_policy}.
         * @return {@code this}
         */
        public Builder streamExceptionPolicy(java.lang.String streamExceptionPolicy) {
            this.streamExceptionPolicy = streamExceptionPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions {
        private final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts flowTimeouts;
        private final java.lang.String ruleOrder;
        private final java.lang.String streamExceptionPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.flowTimeouts = software.amazon.jsii.Kernel.get(this, "flowTimeouts", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts.class));
            this.ruleOrder = software.amazon.jsii.Kernel.get(this, "ruleOrder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.streamExceptionPolicy = software.amazon.jsii.Kernel.get(this, "streamExceptionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.flowTimeouts = builder.flowTimeouts;
            this.ruleOrder = builder.ruleOrder;
            this.streamExceptionPolicy = builder.streamExceptionPolicy;
        }

        @Override
        public final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts getFlowTimeouts() {
            return this.flowTimeouts;
        }

        @Override
        public final java.lang.String getRuleOrder() {
            return this.ruleOrder;
        }

        @Override
        public final java.lang.String getStreamExceptionPolicy() {
            return this.streamExceptionPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFlowTimeouts() != null) {
                data.set("flowTimeouts", om.valueToTree(this.getFlowTimeouts()));
            }
            if (this.getRuleOrder() != null) {
                data.set("ruleOrder", om.valueToTree(this.getRuleOrder()));
            }
            if (this.getStreamExceptionPolicy() != null) {
                data.set("streamExceptionPolicy", om.valueToTree(this.getStreamExceptionPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions.Jsii$Proxy that = (NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions.Jsii$Proxy) o;

            if (this.flowTimeouts != null ? !this.flowTimeouts.equals(that.flowTimeouts) : that.flowTimeouts != null) return false;
            if (this.ruleOrder != null ? !this.ruleOrder.equals(that.ruleOrder) : that.ruleOrder != null) return false;
            return this.streamExceptionPolicy != null ? this.streamExceptionPolicy.equals(that.streamExceptionPolicy) : that.streamExceptionPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.flowTimeouts != null ? this.flowTimeouts.hashCode() : 0;
            result = 31 * result + (this.ruleOrder != null ? this.ruleOrder.hashCode() : 0);
            result = 31 * result + (this.streamExceptionPolicy != null ? this.streamExceptionPolicy.hashCode() : 0);
            return result;
        }
    }
}
