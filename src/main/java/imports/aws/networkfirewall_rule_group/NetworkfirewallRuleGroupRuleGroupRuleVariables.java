package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRuleVariables")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRuleVariables.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRuleVariables extends software.amazon.jsii.JsiiSerializable {

    /**
     * ip_sets block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_sets NetworkfirewallRuleGroup#ip_sets}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIpSets() {
        return null;
    }

    /**
     * port_sets block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#port_sets NetworkfirewallRuleGroup#port_sets}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPortSets() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRuleVariables}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRuleVariables}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRuleVariables> {
        java.lang.Object ipSets;
        java.lang.Object portSets;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRuleVariables#getIpSets}
         * @param ipSets ip_sets block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_sets NetworkfirewallRuleGroup#ip_sets}
         * @return {@code this}
         */
        public Builder ipSets(com.hashicorp.cdktf.IResolvable ipSets) {
            this.ipSets = ipSets;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRuleVariables#getIpSets}
         * @param ipSets ip_sets block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_sets NetworkfirewallRuleGroup#ip_sets}
         * @return {@code this}
         */
        public Builder ipSets(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSets> ipSets) {
            this.ipSets = ipSets;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRuleVariables#getPortSets}
         * @param portSets port_sets block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#port_sets NetworkfirewallRuleGroup#port_sets}
         * @return {@code this}
         */
        public Builder portSets(com.hashicorp.cdktf.IResolvable portSets) {
            this.portSets = portSets;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRuleVariables#getPortSets}
         * @param portSets port_sets block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#port_sets NetworkfirewallRuleGroup#port_sets}
         * @return {@code this}
         */
        public Builder portSets(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets> portSets) {
            this.portSets = portSets;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRuleVariables}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRuleVariables build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRuleVariables}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRuleVariables {
        private final java.lang.Object ipSets;
        private final java.lang.Object portSets;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ipSets = software.amazon.jsii.Kernel.get(this, "ipSets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.portSets = software.amazon.jsii.Kernel.get(this, "portSets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ipSets = builder.ipSets;
            this.portSets = builder.portSets;
        }

        @Override
        public final java.lang.Object getIpSets() {
            return this.ipSets;
        }

        @Override
        public final java.lang.Object getPortSets() {
            return this.portSets;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIpSets() != null) {
                data.set("ipSets", om.valueToTree(this.getIpSets()));
            }
            if (this.getPortSets() != null) {
                data.set("portSets", om.valueToTree(this.getPortSets()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRuleVariables"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRuleVariables.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRuleVariables.Jsii$Proxy) o;

            if (this.ipSets != null ? !this.ipSets.equals(that.ipSets) : that.ipSets != null) return false;
            return this.portSets != null ? this.portSets.equals(that.portSets) : that.portSets == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ipSets != null ? this.ipSets.hashCode() : 0;
            result = 31 * result + (this.portSets != null ? this.portSets.hashCode() : 0);
            return result;
        }
    }
}
