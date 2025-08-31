package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.672Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRule")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclRule.Jsii$Proxy.class)
public interface Wafv2WebAclRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#priority Wafv2WebAcl#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * visibility_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig getVisibilityConfig();

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#action Wafv2WebAcl#action}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction getAction() {
        return null;
    }

    /**
     * captcha_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig getCaptchaConfig() {
        return null;
    }

    /**
     * challenge_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig getChallengeConfig() {
        return null;
    }

    /**
     * override_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#override_action Wafv2WebAcl#override_action}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction getOverrideAction() {
        return null;
    }

    /**
     * rule_label block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_label Wafv2WebAcl#rule_label}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRuleLabel() {
        return null;
    }

    /**
     * statement block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#statement Wafv2WebAcl#statement}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStatement() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclRule> {
        java.lang.String name;
        java.lang.Number priority;
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig visibilityConfig;
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction action;
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig captchaConfig;
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig challengeConfig;
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction overrideAction;
        java.lang.Object ruleLabel;
        java.lang.Object statement;

        /**
         * Sets the value of {@link Wafv2WebAclRule#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#priority Wafv2WebAcl#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getVisibilityConfig}
         * @param visibilityConfig visibility_config block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
         * @return {@code this}
         */
        public Builder visibilityConfig(imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig visibilityConfig) {
            this.visibilityConfig = visibilityConfig;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getAction}
         * @param action action block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#action Wafv2WebAcl#action}
         * @return {@code this}
         */
        public Builder action(imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getCaptchaConfig}
         * @param captchaConfig captcha_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
         * @return {@code this}
         */
        public Builder captchaConfig(imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig captchaConfig) {
            this.captchaConfig = captchaConfig;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getChallengeConfig}
         * @param challengeConfig challenge_config block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
         * @return {@code this}
         */
        public Builder challengeConfig(imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig challengeConfig) {
            this.challengeConfig = challengeConfig;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getOverrideAction}
         * @param overrideAction override_action block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#override_action Wafv2WebAcl#override_action}
         * @return {@code this}
         */
        public Builder overrideAction(imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction overrideAction) {
            this.overrideAction = overrideAction;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getRuleLabel}
         * @param ruleLabel rule_label block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_label Wafv2WebAcl#rule_label}
         * @return {@code this}
         */
        public Builder ruleLabel(com.hashicorp.cdktf.IResolvable ruleLabel) {
            this.ruleLabel = ruleLabel;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getRuleLabel}
         * @param ruleLabel rule_label block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_label Wafv2WebAcl#rule_label}
         * @return {@code this}
         */
        public Builder ruleLabel(java.util.List<? extends imports.aws.wafv2_web_acl.Wafv2WebAclRuleRuleLabel> ruleLabel) {
            this.ruleLabel = ruleLabel;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRule#getStatement}
         * @param statement statement block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#statement Wafv2WebAcl#statement}
         * @return {@code this}
         */
        public Builder statement(java.lang.Object statement) {
            this.statement = statement;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclRule {
        private final java.lang.String name;
        private final java.lang.Number priority;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig visibilityConfig;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction action;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig captchaConfig;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig challengeConfig;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction overrideAction;
        private final java.lang.Object ruleLabel;
        private final java.lang.Object statement;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.visibilityConfig = software.amazon.jsii.Kernel.get(this, "visibilityConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig.class));
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction.class));
            this.captchaConfig = software.amazon.jsii.Kernel.get(this, "captchaConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig.class));
            this.challengeConfig = software.amazon.jsii.Kernel.get(this, "challengeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig.class));
            this.overrideAction = software.amazon.jsii.Kernel.get(this, "overrideAction", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction.class));
            this.ruleLabel = software.amazon.jsii.Kernel.get(this, "ruleLabel", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.statement = software.amazon.jsii.Kernel.get(this, "statement", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.visibilityConfig = java.util.Objects.requireNonNull(builder.visibilityConfig, "visibilityConfig is required");
            this.action = builder.action;
            this.captchaConfig = builder.captchaConfig;
            this.challengeConfig = builder.challengeConfig;
            this.overrideAction = builder.overrideAction;
            this.ruleLabel = builder.ruleLabel;
            this.statement = builder.statement;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig getVisibilityConfig() {
            return this.visibilityConfig;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction getAction() {
            return this.action;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig getCaptchaConfig() {
            return this.captchaConfig;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig getChallengeConfig() {
            return this.challengeConfig;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction getOverrideAction() {
            return this.overrideAction;
        }

        @Override
        public final java.lang.Object getRuleLabel() {
            return this.ruleLabel;
        }

        @Override
        public final java.lang.Object getStatement() {
            return this.statement;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("visibilityConfig", om.valueToTree(this.getVisibilityConfig()));
            if (this.getAction() != null) {
                data.set("action", om.valueToTree(this.getAction()));
            }
            if (this.getCaptchaConfig() != null) {
                data.set("captchaConfig", om.valueToTree(this.getCaptchaConfig()));
            }
            if (this.getChallengeConfig() != null) {
                data.set("challengeConfig", om.valueToTree(this.getChallengeConfig()));
            }
            if (this.getOverrideAction() != null) {
                data.set("overrideAction", om.valueToTree(this.getOverrideAction()));
            }
            if (this.getRuleLabel() != null) {
                data.set("ruleLabel", om.valueToTree(this.getRuleLabel()));
            }
            if (this.getStatement() != null) {
                data.set("statement", om.valueToTree(this.getStatement()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclRule.Jsii$Proxy that = (Wafv2WebAclRule.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!priority.equals(that.priority)) return false;
            if (!visibilityConfig.equals(that.visibilityConfig)) return false;
            if (this.action != null ? !this.action.equals(that.action) : that.action != null) return false;
            if (this.captchaConfig != null ? !this.captchaConfig.equals(that.captchaConfig) : that.captchaConfig != null) return false;
            if (this.challengeConfig != null ? !this.challengeConfig.equals(that.challengeConfig) : that.challengeConfig != null) return false;
            if (this.overrideAction != null ? !this.overrideAction.equals(that.overrideAction) : that.overrideAction != null) return false;
            if (this.ruleLabel != null ? !this.ruleLabel.equals(that.ruleLabel) : that.ruleLabel != null) return false;
            return this.statement != null ? this.statement.equals(that.statement) : that.statement == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.priority.hashCode());
            result = 31 * result + (this.visibilityConfig.hashCode());
            result = 31 * result + (this.action != null ? this.action.hashCode() : 0);
            result = 31 * result + (this.captchaConfig != null ? this.captchaConfig.hashCode() : 0);
            result = 31 * result + (this.challengeConfig != null ? this.challengeConfig.hashCode() : 0);
            result = 31 * result + (this.overrideAction != null ? this.overrideAction.hashCode() : 0);
            result = 31 * result + (this.ruleLabel != null ? this.ruleLabel.hashCode() : 0);
            result = 31 * result + (this.statement != null ? this.statement.hashCode() : 0);
            return result;
        }
    }
}
