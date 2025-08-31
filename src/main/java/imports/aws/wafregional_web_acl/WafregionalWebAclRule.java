package imports.aws.wafregional_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.660Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafregionalWebAcl.WafregionalWebAclRule")
@software.amazon.jsii.Jsii.Proxy(WafregionalWebAclRule.Jsii$Proxy.class)
public interface WafregionalWebAclRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#priority WafregionalWebAcl#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#rule_id WafregionalWebAcl#rule_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleId();

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#action WafregionalWebAcl#action}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafregional_web_acl.WafregionalWebAclRuleAction getAction() {
        return null;
    }

    /**
     * override_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#override_action WafregionalWebAcl#override_action}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafregional_web_acl.WafregionalWebAclRuleOverrideAction getOverrideAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#type WafregionalWebAcl#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WafregionalWebAclRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafregionalWebAclRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafregionalWebAclRule> {
        java.lang.Number priority;
        java.lang.String ruleId;
        imports.aws.wafregional_web_acl.WafregionalWebAclRuleAction action;
        imports.aws.wafregional_web_acl.WafregionalWebAclRuleOverrideAction overrideAction;
        java.lang.String type;

        /**
         * Sets the value of {@link WafregionalWebAclRule#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#priority WafregionalWebAcl#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalWebAclRule#getRuleId}
         * @param ruleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#rule_id WafregionalWebAcl#rule_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleId(java.lang.String ruleId) {
            this.ruleId = ruleId;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalWebAclRule#getAction}
         * @param action action block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#action WafregionalWebAcl#action}
         * @return {@code this}
         */
        public Builder action(imports.aws.wafregional_web_acl.WafregionalWebAclRuleAction action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalWebAclRule#getOverrideAction}
         * @param overrideAction override_action block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#override_action WafregionalWebAcl#override_action}
         * @return {@code this}
         */
        public Builder overrideAction(imports.aws.wafregional_web_acl.WafregionalWebAclRuleOverrideAction overrideAction) {
            this.overrideAction = overrideAction;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalWebAclRule#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#type WafregionalWebAcl#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafregionalWebAclRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafregionalWebAclRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafregionalWebAclRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafregionalWebAclRule {
        private final java.lang.Number priority;
        private final java.lang.String ruleId;
        private final imports.aws.wafregional_web_acl.WafregionalWebAclRuleAction action;
        private final imports.aws.wafregional_web_acl.WafregionalWebAclRuleOverrideAction overrideAction;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ruleId = software.amazon.jsii.Kernel.get(this, "ruleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.wafregional_web_acl.WafregionalWebAclRuleAction.class));
            this.overrideAction = software.amazon.jsii.Kernel.get(this, "overrideAction", software.amazon.jsii.NativeType.forClass(imports.aws.wafregional_web_acl.WafregionalWebAclRuleOverrideAction.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.ruleId = java.util.Objects.requireNonNull(builder.ruleId, "ruleId is required");
            this.action = builder.action;
            this.overrideAction = builder.overrideAction;
            this.type = builder.type;
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
        public final imports.aws.wafregional_web_acl.WafregionalWebAclRuleAction getAction() {
            return this.action;
        }

        @Override
        public final imports.aws.wafregional_web_acl.WafregionalWebAclRuleOverrideAction getOverrideAction() {
            return this.overrideAction;
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

            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("ruleId", om.valueToTree(this.getRuleId()));
            if (this.getAction() != null) {
                data.set("action", om.valueToTree(this.getAction()));
            }
            if (this.getOverrideAction() != null) {
                data.set("overrideAction", om.valueToTree(this.getOverrideAction()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafregionalWebAcl.WafregionalWebAclRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafregionalWebAclRule.Jsii$Proxy that = (WafregionalWebAclRule.Jsii$Proxy) o;

            if (!priority.equals(that.priority)) return false;
            if (!ruleId.equals(that.ruleId)) return false;
            if (this.action != null ? !this.action.equals(that.action) : that.action != null) return false;
            if (this.overrideAction != null ? !this.overrideAction.equals(that.overrideAction) : that.overrideAction != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.priority.hashCode();
            result = 31 * result + (this.ruleId.hashCode());
            result = 31 * result + (this.action != null ? this.action.hashCode() : 0);
            result = 31 * result + (this.overrideAction != null ? this.overrideAction.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
