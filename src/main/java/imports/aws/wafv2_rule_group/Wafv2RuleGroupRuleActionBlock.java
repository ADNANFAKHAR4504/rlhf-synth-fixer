package imports.aws.wafv2_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.667Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlock")
@software.amazon.jsii.Jsii.Proxy(Wafv2RuleGroupRuleActionBlock.Jsii$Proxy.class)
public interface Wafv2RuleGroupRuleActionBlock extends software.amazon.jsii.JsiiSerializable {

    /**
     * custom_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response Wafv2RuleGroup#custom_response}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlockCustomResponse getCustomResponse() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2RuleGroupRuleActionBlock}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2RuleGroupRuleActionBlock}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2RuleGroupRuleActionBlock> {
        imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlockCustomResponse customResponse;

        /**
         * Sets the value of {@link Wafv2RuleGroupRuleActionBlock#getCustomResponse}
         * @param customResponse custom_response block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response Wafv2RuleGroup#custom_response}
         * @return {@code this}
         */
        public Builder customResponse(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlockCustomResponse customResponse) {
            this.customResponse = customResponse;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2RuleGroupRuleActionBlock}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2RuleGroupRuleActionBlock build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2RuleGroupRuleActionBlock}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2RuleGroupRuleActionBlock {
        private final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlockCustomResponse customResponse;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customResponse = software.amazon.jsii.Kernel.get(this, "customResponse", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlockCustomResponse.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customResponse = builder.customResponse;
        }

        @Override
        public final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlockCustomResponse getCustomResponse() {
            return this.customResponse;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomResponse() != null) {
                data.set("customResponse", om.valueToTree(this.getCustomResponse()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlock"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2RuleGroupRuleActionBlock.Jsii$Proxy that = (Wafv2RuleGroupRuleActionBlock.Jsii$Proxy) o;

            return this.customResponse != null ? this.customResponse.equals(that.customResponse) : that.customResponse == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customResponse != null ? this.customResponse.hashCode() : 0;
            return result;
        }
    }
}
