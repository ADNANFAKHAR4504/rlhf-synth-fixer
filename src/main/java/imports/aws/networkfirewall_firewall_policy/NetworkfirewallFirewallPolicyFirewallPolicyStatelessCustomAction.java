package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction.Jsii$Proxy.class)
public interface NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * action_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#action_definition NetworkfirewallFirewallPolicy#action_definition}
     */
    @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition getActionDefinition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#action_name NetworkfirewallFirewallPolicy#action_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getActionName();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction> {
        imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition actionDefinition;
        java.lang.String actionName;

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction#getActionDefinition}
         * @param actionDefinition action_definition block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#action_definition NetworkfirewallFirewallPolicy#action_definition}
         * @return {@code this}
         */
        public Builder actionDefinition(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition actionDefinition) {
            this.actionDefinition = actionDefinition;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction#getActionName}
         * @param actionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#action_name NetworkfirewallFirewallPolicy#action_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder actionName(java.lang.String actionName) {
            this.actionName = actionName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction {
        private final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition actionDefinition;
        private final java.lang.String actionName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actionDefinition = software.amazon.jsii.Kernel.get(this, "actionDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition.class));
            this.actionName = software.amazon.jsii.Kernel.get(this, "actionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actionDefinition = java.util.Objects.requireNonNull(builder.actionDefinition, "actionDefinition is required");
            this.actionName = java.util.Objects.requireNonNull(builder.actionName, "actionName is required");
        }

        @Override
        public final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition getActionDefinition() {
            return this.actionDefinition;
        }

        @Override
        public final java.lang.String getActionName() {
            return this.actionName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actionDefinition", om.valueToTree(this.getActionDefinition()));
            data.set("actionName", om.valueToTree(this.getActionName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction.Jsii$Proxy that = (NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction.Jsii$Proxy) o;

            if (!actionDefinition.equals(that.actionDefinition)) return false;
            return this.actionName.equals(that.actionName);
        }

        @Override
        public final int hashCode() {
            int result = this.actionDefinition.hashCode();
            result = 31 * result + (this.actionName.hashCode());
            return result;
        }
    }
}
