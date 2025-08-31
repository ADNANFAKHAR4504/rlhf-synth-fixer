package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.950Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables.Jsii$Proxy.class)
public interface NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables extends software.amazon.jsii.JsiiSerializable {

    /**
     * rule_variables block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#rule_variables NetworkfirewallFirewallPolicy#rule_variables}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRuleVariables() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables> {
        java.lang.Object ruleVariables;

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables#getRuleVariables}
         * @param ruleVariables rule_variables block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#rule_variables NetworkfirewallFirewallPolicy#rule_variables}
         * @return {@code this}
         */
        public Builder ruleVariables(com.hashicorp.cdktf.IResolvable ruleVariables) {
            this.ruleVariables = ruleVariables;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables#getRuleVariables}
         * @param ruleVariables rule_variables block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#rule_variables NetworkfirewallFirewallPolicy#rule_variables}
         * @return {@code this}
         */
        public Builder ruleVariables(java.util.List<? extends imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables> ruleVariables) {
            this.ruleVariables = ruleVariables;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables {
        private final java.lang.Object ruleVariables;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ruleVariables = software.amazon.jsii.Kernel.get(this, "ruleVariables", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ruleVariables = builder.ruleVariables;
        }

        @Override
        public final java.lang.Object getRuleVariables() {
            return this.ruleVariables;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRuleVariables() != null) {
                data.set("ruleVariables", om.valueToTree(this.getRuleVariables()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables.Jsii$Proxy that = (NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables.Jsii$Proxy) o;

            return this.ruleVariables != null ? this.ruleVariables.equals(that.ruleVariables) : that.ruleVariables == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ruleVariables != null ? this.ruleVariables.hashCode() : 0;
            return result;
        }
    }
}
