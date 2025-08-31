package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables.Jsii$Proxy.class)
public interface NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables extends software.amazon.jsii.JsiiSerializable {

    /**
     * ip_set block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#ip_set NetworkfirewallFirewallPolicy#ip_set}
     */
    @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariablesIpSet getIpSet();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#key NetworkfirewallFirewallPolicy#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables> {
        imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariablesIpSet ipSet;
        java.lang.String key;

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables#getIpSet}
         * @param ipSet ip_set block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#ip_set NetworkfirewallFirewallPolicy#ip_set}
         * @return {@code this}
         */
        public Builder ipSet(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariablesIpSet ipSet) {
            this.ipSet = ipSet;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#key NetworkfirewallFirewallPolicy#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables {
        private final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariablesIpSet ipSet;
        private final java.lang.String key;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ipSet = software.amazon.jsii.Kernel.get(this, "ipSet", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariablesIpSet.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ipSet = java.util.Objects.requireNonNull(builder.ipSet, "ipSet is required");
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
        }

        @Override
        public final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariablesIpSet getIpSet() {
            return this.ipSet;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ipSet", om.valueToTree(this.getIpSet()));
            data.set("key", om.valueToTree(this.getKey()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables.Jsii$Proxy that = (NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesRuleVariables.Jsii$Proxy) o;

            if (!ipSet.equals(that.ipSet)) return false;
            return this.key.equals(that.key);
        }

        @Override
        public final int hashCode() {
            int result = this.ipSet.hashCode();
            result = 31 * result + (this.key.hashCode());
            return result;
        }
    }
}
