package imports.aws.wafv2_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.668Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling")
@software.amazon.jsii.Jsii.Proxy(Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling.Jsii$Proxy.class)
public interface Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling extends software.amazon.jsii.JsiiSerializable {

    /**
     * insert_header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getInsertHeader();

    /**
     * @return a {@link Builder} of {@link Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling> {
        java.lang.Object insertHeader;

        /**
         * Sets the value of {@link Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling#getInsertHeader}
         * @param insertHeader insert_header block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
         * @return {@code this}
         */
        public Builder insertHeader(com.hashicorp.cdktf.IResolvable insertHeader) {
            this.insertHeader = insertHeader;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling#getInsertHeader}
         * @param insertHeader insert_header block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
         * @return {@code this}
         */
        public Builder insertHeader(java.util.List<? extends imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader> insertHeader) {
            this.insertHeader = insertHeader;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling {
        private final java.lang.Object insertHeader;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.insertHeader = software.amazon.jsii.Kernel.get(this, "insertHeader", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.insertHeader = java.util.Objects.requireNonNull(builder.insertHeader, "insertHeader is required");
        }

        @Override
        public final java.lang.Object getInsertHeader() {
            return this.insertHeader;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("insertHeader", om.valueToTree(this.getInsertHeader()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling.Jsii$Proxy that = (Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling.Jsii$Proxy) o;

            return this.insertHeader.equals(that.insertHeader);
        }

        @Override
        public final int hashCode() {
            int result = this.insertHeader.hashCode();
            return result;
        }
    }
}
