package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSource")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRulesSource.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRulesSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * rules_source_list block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rules_source_list NetworkfirewallRuleGroup#rules_source_list}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct getRulesSourceList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rules_string NetworkfirewallRuleGroup#rules_string}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRulesString() {
        return null;
    }

    /**
     * stateful_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateful_rule NetworkfirewallRuleGroup#stateful_rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStatefulRule() {
        return null;
    }

    /**
     * stateless_rules_and_custom_actions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateless_rules_and_custom_actions NetworkfirewallRuleGroup#stateless_rules_and_custom_actions}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions getStatelessRulesAndCustomActions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRulesSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRulesSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRulesSource> {
        imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct rulesSourceList;
        java.lang.String rulesString;
        java.lang.Object statefulRule;
        imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions statelessRulesAndCustomActions;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSource#getRulesSourceList}
         * @param rulesSourceList rules_source_list block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rules_source_list NetworkfirewallRuleGroup#rules_source_list}
         * @return {@code this}
         */
        public Builder rulesSourceList(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct rulesSourceList) {
            this.rulesSourceList = rulesSourceList;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSource#getRulesString}
         * @param rulesString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rules_string NetworkfirewallRuleGroup#rules_string}.
         * @return {@code this}
         */
        public Builder rulesString(java.lang.String rulesString) {
            this.rulesString = rulesString;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSource#getStatefulRule}
         * @param statefulRule stateful_rule block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateful_rule NetworkfirewallRuleGroup#stateful_rule}
         * @return {@code this}
         */
        public Builder statefulRule(com.hashicorp.cdktf.IResolvable statefulRule) {
            this.statefulRule = statefulRule;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSource#getStatefulRule}
         * @param statefulRule stateful_rule block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateful_rule NetworkfirewallRuleGroup#stateful_rule}
         * @return {@code this}
         */
        public Builder statefulRule(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule> statefulRule) {
            this.statefulRule = statefulRule;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSource#getStatelessRulesAndCustomActions}
         * @param statelessRulesAndCustomActions stateless_rules_and_custom_actions block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateless_rules_and_custom_actions NetworkfirewallRuleGroup#stateless_rules_and_custom_actions}
         * @return {@code this}
         */
        public Builder statelessRulesAndCustomActions(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions statelessRulesAndCustomActions) {
            this.statelessRulesAndCustomActions = statelessRulesAndCustomActions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRulesSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRulesSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRulesSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRulesSource {
        private final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct rulesSourceList;
        private final java.lang.String rulesString;
        private final java.lang.Object statefulRule;
        private final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions statelessRulesAndCustomActions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.rulesSourceList = software.amazon.jsii.Kernel.get(this, "rulesSourceList", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct.class));
            this.rulesString = software.amazon.jsii.Kernel.get(this, "rulesString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statefulRule = software.amazon.jsii.Kernel.get(this, "statefulRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.statelessRulesAndCustomActions = software.amazon.jsii.Kernel.get(this, "statelessRulesAndCustomActions", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.rulesSourceList = builder.rulesSourceList;
            this.rulesString = builder.rulesString;
            this.statefulRule = builder.statefulRule;
            this.statelessRulesAndCustomActions = builder.statelessRulesAndCustomActions;
        }

        @Override
        public final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct getRulesSourceList() {
            return this.rulesSourceList;
        }

        @Override
        public final java.lang.String getRulesString() {
            return this.rulesString;
        }

        @Override
        public final java.lang.Object getStatefulRule() {
            return this.statefulRule;
        }

        @Override
        public final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions getStatelessRulesAndCustomActions() {
            return this.statelessRulesAndCustomActions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRulesSourceList() != null) {
                data.set("rulesSourceList", om.valueToTree(this.getRulesSourceList()));
            }
            if (this.getRulesString() != null) {
                data.set("rulesString", om.valueToTree(this.getRulesString()));
            }
            if (this.getStatefulRule() != null) {
                data.set("statefulRule", om.valueToTree(this.getStatefulRule()));
            }
            if (this.getStatelessRulesAndCustomActions() != null) {
                data.set("statelessRulesAndCustomActions", om.valueToTree(this.getStatelessRulesAndCustomActions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRulesSource.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRulesSource.Jsii$Proxy) o;

            if (this.rulesSourceList != null ? !this.rulesSourceList.equals(that.rulesSourceList) : that.rulesSourceList != null) return false;
            if (this.rulesString != null ? !this.rulesString.equals(that.rulesString) : that.rulesString != null) return false;
            if (this.statefulRule != null ? !this.statefulRule.equals(that.statefulRule) : that.statefulRule != null) return false;
            return this.statelessRulesAndCustomActions != null ? this.statelessRulesAndCustomActions.equals(that.statelessRulesAndCustomActions) : that.statelessRulesAndCustomActions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.rulesSourceList != null ? this.rulesSourceList.hashCode() : 0;
            result = 31 * result + (this.rulesString != null ? this.rulesString.hashCode() : 0);
            result = 31 * result + (this.statefulRule != null ? this.statefulRule.hashCode() : 0);
            result = 31 * result + (this.statelessRulesAndCustomActions != null ? this.statelessRulesAndCustomActions.hashCode() : 0);
            return result;
        }
    }
}
