package imports.aws.wafv2_web_acl_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.680Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition.Jsii$Proxy.class)
public interface Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * action_condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#action_condition Wafv2WebAclLoggingConfiguration#action_condition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition getActionCondition() {
        return null;
    }

    /**
     * label_name_condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#label_name_condition Wafv2WebAclLoggingConfiguration#label_name_condition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition getLabelNameCondition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition> {
        imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition actionCondition;
        imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition labelNameCondition;

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition#getActionCondition}
         * @param actionCondition action_condition block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#action_condition Wafv2WebAclLoggingConfiguration#action_condition}
         * @return {@code this}
         */
        public Builder actionCondition(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition actionCondition) {
            this.actionCondition = actionCondition;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition#getLabelNameCondition}
         * @param labelNameCondition label_name_condition block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#label_name_condition Wafv2WebAclLoggingConfiguration#label_name_condition}
         * @return {@code this}
         */
        public Builder labelNameCondition(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition labelNameCondition) {
            this.labelNameCondition = labelNameCondition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition {
        private final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition actionCondition;
        private final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition labelNameCondition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actionCondition = software.amazon.jsii.Kernel.get(this, "actionCondition", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition.class));
            this.labelNameCondition = software.amazon.jsii.Kernel.get(this, "labelNameCondition", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actionCondition = builder.actionCondition;
            this.labelNameCondition = builder.labelNameCondition;
        }

        @Override
        public final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition getActionCondition() {
            return this.actionCondition;
        }

        @Override
        public final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition getLabelNameCondition() {
            return this.labelNameCondition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getActionCondition() != null) {
                data.set("actionCondition", om.valueToTree(this.getActionCondition()));
            }
            if (this.getLabelNameCondition() != null) {
                data.set("labelNameCondition", om.valueToTree(this.getLabelNameCondition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition.Jsii$Proxy that = (Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition.Jsii$Proxy) o;

            if (this.actionCondition != null ? !this.actionCondition.equals(that.actionCondition) : that.actionCondition != null) return false;
            return this.labelNameCondition != null ? this.labelNameCondition.equals(that.labelNameCondition) : that.labelNameCondition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.actionCondition != null ? this.actionCondition.hashCode() : 0;
            result = 31 * result + (this.labelNameCondition != null ? this.labelNameCondition.hashCode() : 0);
            return result;
        }
    }
}
