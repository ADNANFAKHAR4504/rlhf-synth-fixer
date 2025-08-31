package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.961Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rule_order NetworkfirewallRuleGroup#rule_order}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleOrder();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions> {
        java.lang.String ruleOrder;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions#getRuleOrder}
         * @param ruleOrder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rule_order NetworkfirewallRuleGroup#rule_order}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleOrder(java.lang.String ruleOrder) {
            this.ruleOrder = ruleOrder;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions {
        private final java.lang.String ruleOrder;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ruleOrder = software.amazon.jsii.Kernel.get(this, "ruleOrder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ruleOrder = java.util.Objects.requireNonNull(builder.ruleOrder, "ruleOrder is required");
        }

        @Override
        public final java.lang.String getRuleOrder() {
            return this.ruleOrder;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ruleOrder", om.valueToTree(this.getRuleOrder()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions.Jsii$Proxy) o;

            return this.ruleOrder.equals(that.ruleOrder);
        }

        @Override
        public final int hashCode() {
            int result = this.ruleOrder.hashCode();
            return result;
        }
    }
}
