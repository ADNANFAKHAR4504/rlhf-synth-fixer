package imports.aws.wafv2_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.667Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2RuleGroup.Wafv2RuleGroupRuleAction")
@software.amazon.jsii.Jsii.Proxy(Wafv2RuleGroupRuleAction.Jsii$Proxy.class)
public interface Wafv2RuleGroupRuleAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * allow block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#allow Wafv2RuleGroup#allow}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllow getAllow() {
        return null;
    }

    /**
     * block block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#block Wafv2RuleGroup#block}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlock getBlock() {
        return null;
    }

    /**
     * captcha block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#captcha Wafv2RuleGroup#captcha}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCaptcha getCaptcha() {
        return null;
    }

    /**
     * challenge block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#challenge Wafv2RuleGroup#challenge}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge getChallenge() {
        return null;
    }

    /**
     * count block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#count Wafv2RuleGroup#count}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCount getCount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2RuleGroupRuleAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2RuleGroupRuleAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2RuleGroupRuleAction> {
        imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllow allow;
        imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlock block;
        imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCaptcha captcha;
        imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge challenge;
        imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCount count;

        /**
         * Sets the value of {@link Wafv2RuleGroupRuleAction#getAllow}
         * @param allow allow block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#allow Wafv2RuleGroup#allow}
         * @return {@code this}
         */
        public Builder allow(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllow allow) {
            this.allow = allow;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2RuleGroupRuleAction#getBlock}
         * @param block block block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#block Wafv2RuleGroup#block}
         * @return {@code this}
         */
        public Builder block(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlock block) {
            this.block = block;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2RuleGroupRuleAction#getCaptcha}
         * @param captcha captcha block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#captcha Wafv2RuleGroup#captcha}
         * @return {@code this}
         */
        public Builder captcha(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCaptcha captcha) {
            this.captcha = captcha;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2RuleGroupRuleAction#getChallenge}
         * @param challenge challenge block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#challenge Wafv2RuleGroup#challenge}
         * @return {@code this}
         */
        public Builder challenge(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge challenge) {
            this.challenge = challenge;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2RuleGroupRuleAction#getCount}
         * @param count count block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#count Wafv2RuleGroup#count}
         * @return {@code this}
         */
        public Builder count(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCount count) {
            this.count = count;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2RuleGroupRuleAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2RuleGroupRuleAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2RuleGroupRuleAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2RuleGroupRuleAction {
        private final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllow allow;
        private final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlock block;
        private final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCaptcha captcha;
        private final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge challenge;
        private final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCount count;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allow = software.amazon.jsii.Kernel.get(this, "allow", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllow.class));
            this.block = software.amazon.jsii.Kernel.get(this, "block", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlock.class));
            this.captcha = software.amazon.jsii.Kernel.get(this, "captcha", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCaptcha.class));
            this.challenge = software.amazon.jsii.Kernel.get(this, "challenge", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCount.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allow = builder.allow;
            this.block = builder.block;
            this.captcha = builder.captcha;
            this.challenge = builder.challenge;
            this.count = builder.count;
        }

        @Override
        public final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllow getAllow() {
            return this.allow;
        }

        @Override
        public final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionBlock getBlock() {
            return this.block;
        }

        @Override
        public final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCaptcha getCaptcha() {
            return this.captcha;
        }

        @Override
        public final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge getChallenge() {
            return this.challenge;
        }

        @Override
        public final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionCount getCount() {
            return this.count;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllow() != null) {
                data.set("allow", om.valueToTree(this.getAllow()));
            }
            if (this.getBlock() != null) {
                data.set("block", om.valueToTree(this.getBlock()));
            }
            if (this.getCaptcha() != null) {
                data.set("captcha", om.valueToTree(this.getCaptcha()));
            }
            if (this.getChallenge() != null) {
                data.set("challenge", om.valueToTree(this.getChallenge()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2RuleGroup.Wafv2RuleGroupRuleAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2RuleGroupRuleAction.Jsii$Proxy that = (Wafv2RuleGroupRuleAction.Jsii$Proxy) o;

            if (this.allow != null ? !this.allow.equals(that.allow) : that.allow != null) return false;
            if (this.block != null ? !this.block.equals(that.block) : that.block != null) return false;
            if (this.captcha != null ? !this.captcha.equals(that.captcha) : that.captcha != null) return false;
            if (this.challenge != null ? !this.challenge.equals(that.challenge) : that.challenge != null) return false;
            return this.count != null ? this.count.equals(that.count) : that.count == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allow != null ? this.allow.hashCode() : 0;
            result = 31 * result + (this.block != null ? this.block.hashCode() : 0);
            result = 31 * result + (this.captcha != null ? this.captcha.hashCode() : 0);
            result = 31 * result + (this.challenge != null ? this.challenge.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            return result;
        }
    }
}
