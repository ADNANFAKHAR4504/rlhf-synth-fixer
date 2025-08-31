package imports.aws.wafregional_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.657Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafregionalRuleGroup.WafregionalRuleGroupActivatedRule")
@software.amazon.jsii.Jsii.Proxy(WafregionalRuleGroupActivatedRule.Jsii$Proxy.class)
public interface WafregionalRuleGroupActivatedRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_rule_group#action WafregionalRuleGroup#action}
     */
    @org.jetbrains.annotations.NotNull imports.aws.wafregional_rule_group.WafregionalRuleGroupActivatedRuleAction getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_rule_group#priority WafregionalRuleGroup#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_rule_group#rule_id WafregionalRuleGroup#rule_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_rule_group#type WafregionalRuleGroup#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WafregionalRuleGroupActivatedRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafregionalRuleGroupActivatedRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafregionalRuleGroupActivatedRule> {
        imports.aws.wafregional_rule_group.WafregionalRuleGroupActivatedRuleAction action;
        java.lang.Number priority;
        java.lang.String ruleId;
        java.lang.String type;

        /**
         * Sets the value of {@link WafregionalRuleGroupActivatedRule#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_rule_group#action WafregionalRuleGroup#action}
         * @return {@code this}
         */
        public Builder action(imports.aws.wafregional_rule_group.WafregionalRuleGroupActivatedRuleAction action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalRuleGroupActivatedRule#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_rule_group#priority WafregionalRuleGroup#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalRuleGroupActivatedRule#getRuleId}
         * @param ruleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_rule_group#rule_id WafregionalRuleGroup#rule_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleId(java.lang.String ruleId) {
            this.ruleId = ruleId;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalRuleGroupActivatedRule#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_rule_group#type WafregionalRuleGroup#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafregionalRuleGroupActivatedRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafregionalRuleGroupActivatedRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafregionalRuleGroupActivatedRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafregionalRuleGroupActivatedRule {
        private final imports.aws.wafregional_rule_group.WafregionalRuleGroupActivatedRuleAction action;
        private final java.lang.Number priority;
        private final java.lang.String ruleId;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.wafregional_rule_group.WafregionalRuleGroupActivatedRuleAction.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ruleId = software.amazon.jsii.Kernel.get(this, "ruleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.ruleId = java.util.Objects.requireNonNull(builder.ruleId, "ruleId is required");
            this.type = builder.type;
        }

        @Override
        public final imports.aws.wafregional_rule_group.WafregionalRuleGroupActivatedRuleAction getAction() {
            return this.action;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getRuleId() {
            return this.ruleId;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("ruleId", om.valueToTree(this.getRuleId()));
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafregionalRuleGroup.WafregionalRuleGroupActivatedRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafregionalRuleGroupActivatedRule.Jsii$Proxy that = (WafregionalRuleGroupActivatedRule.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!priority.equals(that.priority)) return false;
            if (!ruleId.equals(that.ruleId)) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.priority.hashCode());
            result = 31 * result + (this.ruleId.hashCode());
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
