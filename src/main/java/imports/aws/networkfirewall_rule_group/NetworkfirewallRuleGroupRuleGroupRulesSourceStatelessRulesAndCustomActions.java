package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions extends software.amazon.jsii.JsiiSerializable {

    /**
     * stateless_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateless_rule NetworkfirewallRuleGroup#stateless_rule}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getStatelessRule();

    /**
     * custom_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#custom_action NetworkfirewallRuleGroup#custom_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomAction() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions> {
        java.lang.Object statelessRule;
        java.lang.Object customAction;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions#getStatelessRule}
         * @param statelessRule stateless_rule block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateless_rule NetworkfirewallRuleGroup#stateless_rule}
         * @return {@code this}
         */
        public Builder statelessRule(com.hashicorp.cdktf.IResolvable statelessRule) {
            this.statelessRule = statelessRule;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions#getStatelessRule}
         * @param statelessRule stateless_rule block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateless_rule NetworkfirewallRuleGroup#stateless_rule}
         * @return {@code this}
         */
        public Builder statelessRule(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRule> statelessRule) {
            this.statelessRule = statelessRule;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions#getCustomAction}
         * @param customAction custom_action block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#custom_action NetworkfirewallRuleGroup#custom_action}
         * @return {@code this}
         */
        public Builder customAction(com.hashicorp.cdktf.IResolvable customAction) {
            this.customAction = customAction;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions#getCustomAction}
         * @param customAction custom_action block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#custom_action NetworkfirewallRuleGroup#custom_action}
         * @return {@code this}
         */
        public Builder customAction(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsCustomAction> customAction) {
            this.customAction = customAction;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions {
        private final java.lang.Object statelessRule;
        private final java.lang.Object customAction;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.statelessRule = software.amazon.jsii.Kernel.get(this, "statelessRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customAction = software.amazon.jsii.Kernel.get(this, "customAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.statelessRule = java.util.Objects.requireNonNull(builder.statelessRule, "statelessRule is required");
            this.customAction = builder.customAction;
        }

        @Override
        public final java.lang.Object getStatelessRule() {
            return this.statelessRule;
        }

        @Override
        public final java.lang.Object getCustomAction() {
            return this.customAction;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("statelessRule", om.valueToTree(this.getStatelessRule()));
            if (this.getCustomAction() != null) {
                data.set("customAction", om.valueToTree(this.getCustomAction()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions.Jsii$Proxy) o;

            if (!statelessRule.equals(that.statelessRule)) return false;
            return this.customAction != null ? this.customAction.equals(that.customAction) : that.customAction == null;
        }

        @Override
        public final int hashCode() {
            int result = this.statelessRule.hashCode();
            result = 31 * result + (this.customAction != null ? this.customAction.hashCode() : 0);
            return result;
        }
    }
}
