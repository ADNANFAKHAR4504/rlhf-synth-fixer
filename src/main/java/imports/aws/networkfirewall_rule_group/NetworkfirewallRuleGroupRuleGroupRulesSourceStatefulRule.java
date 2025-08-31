package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#action NetworkfirewallRuleGroup#action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAction();

    /**
     * header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#header NetworkfirewallRuleGroup#header}
     */
    @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader getHeader();

    /**
     * rule_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rule_option NetworkfirewallRuleGroup#rule_option}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRuleOption();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule> {
        java.lang.String action;
        imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader header;
        java.lang.Object ruleOption;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule#getAction}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#action NetworkfirewallRuleGroup#action}. This parameter is required.
         * @return {@code this}
         */
        public Builder action(java.lang.String action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule#getHeader}
         * @param header header block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#header NetworkfirewallRuleGroup#header}
         * @return {@code this}
         */
        public Builder header(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule#getRuleOption}
         * @param ruleOption rule_option block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rule_option NetworkfirewallRuleGroup#rule_option}
         * @return {@code this}
         */
        public Builder ruleOption(com.hashicorp.cdktf.IResolvable ruleOption) {
            this.ruleOption = ruleOption;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule#getRuleOption}
         * @param ruleOption rule_option block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rule_option NetworkfirewallRuleGroup#rule_option}
         * @return {@code this}
         */
        public Builder ruleOption(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption> ruleOption) {
            this.ruleOption = ruleOption;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule {
        private final java.lang.String action;
        private final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader header;
        private final java.lang.Object ruleOption;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader.class));
            this.ruleOption = software.amazon.jsii.Kernel.get(this, "ruleOption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.header = java.util.Objects.requireNonNull(builder.header, "header is required");
            this.ruleOption = java.util.Objects.requireNonNull(builder.ruleOption, "ruleOption is required");
        }

        @Override
        public final java.lang.String getAction() {
            return this.action;
        }

        @Override
        public final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader getHeader() {
            return this.header;
        }

        @Override
        public final java.lang.Object getRuleOption() {
            return this.ruleOption;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("header", om.valueToTree(this.getHeader()));
            data.set("ruleOption", om.valueToTree(this.getRuleOption()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!header.equals(that.header)) return false;
            return this.ruleOption.equals(that.ruleOption);
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.header.hashCode());
            result = 31 * result + (this.ruleOption.hashCode());
            return result;
        }
    }
}
