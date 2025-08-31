package imports.aws.wafv2_web_acl_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.680Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationLoggingFilterFilter")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclLoggingConfigurationLoggingFilterFilter.Jsii$Proxy.class)
public interface Wafv2WebAclLoggingConfigurationLoggingFilterFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#behavior Wafv2WebAclLoggingConfiguration#behavior}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBehavior();

    /**
     * condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#condition Wafv2WebAclLoggingConfiguration#condition}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getCondition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#requirement Wafv2WebAclLoggingConfiguration#requirement}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRequirement();

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclLoggingConfigurationLoggingFilterFilter> {
        java.lang.String behavior;
        java.lang.Object condition;
        java.lang.String requirement;

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilter#getBehavior}
         * @param behavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#behavior Wafv2WebAclLoggingConfiguration#behavior}. This parameter is required.
         * @return {@code this}
         */
        public Builder behavior(java.lang.String behavior) {
            this.behavior = behavior;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilter#getCondition}
         * @param condition condition block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#condition Wafv2WebAclLoggingConfiguration#condition}
         * @return {@code this}
         */
        public Builder condition(com.hashicorp.cdktf.IResolvable condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilter#getCondition}
         * @param condition condition block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#condition Wafv2WebAclLoggingConfiguration#condition}
         * @return {@code this}
         */
        public Builder condition(java.util.List<? extends imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition> condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilter#getRequirement}
         * @param requirement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#requirement Wafv2WebAclLoggingConfiguration#requirement}. This parameter is required.
         * @return {@code this}
         */
        public Builder requirement(java.lang.String requirement) {
            this.requirement = requirement;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclLoggingConfigurationLoggingFilterFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclLoggingConfigurationLoggingFilterFilter {
        private final java.lang.String behavior;
        private final java.lang.Object condition;
        private final java.lang.String requirement;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.behavior = software.amazon.jsii.Kernel.get(this, "behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.condition = software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requirement = software.amazon.jsii.Kernel.get(this, "requirement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.behavior = java.util.Objects.requireNonNull(builder.behavior, "behavior is required");
            this.condition = java.util.Objects.requireNonNull(builder.condition, "condition is required");
            this.requirement = java.util.Objects.requireNonNull(builder.requirement, "requirement is required");
        }

        @Override
        public final java.lang.String getBehavior() {
            return this.behavior;
        }

        @Override
        public final java.lang.Object getCondition() {
            return this.condition;
        }

        @Override
        public final java.lang.String getRequirement() {
            return this.requirement;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("behavior", om.valueToTree(this.getBehavior()));
            data.set("condition", om.valueToTree(this.getCondition()));
            data.set("requirement", om.valueToTree(this.getRequirement()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationLoggingFilterFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclLoggingConfigurationLoggingFilterFilter.Jsii$Proxy that = (Wafv2WebAclLoggingConfigurationLoggingFilterFilter.Jsii$Proxy) o;

            if (!behavior.equals(that.behavior)) return false;
            if (!condition.equals(that.condition)) return false;
            return this.requirement.equals(that.requirement);
        }

        @Override
        public final int hashCode() {
            int result = this.behavior.hashCode();
            result = 31 * result + (this.condition.hashCode());
            result = 31 * result + (this.requirement.hashCode());
            return result;
        }
    }
}
