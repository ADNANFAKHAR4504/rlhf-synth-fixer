package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.210Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleName();

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration> {
        java.lang.String ruleName;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration#getRuleName}
         * @param ruleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleName(java.lang.String ruleName) {
            this.ruleName = ruleName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration {
        private final java.lang.String ruleName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ruleName = software.amazon.jsii.Kernel.get(this, "ruleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ruleName = java.util.Objects.requireNonNull(builder.ruleName, "ruleName is required");
        }

        @Override
        public final java.lang.String getRuleName() {
            return this.ruleName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ruleName", om.valueToTree(this.getRuleName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration.Jsii$Proxy) o;

            return this.ruleName.equals(that.ruleName);
        }

        @Override
        public final int hashCode() {
            int result = this.ruleName.hashCode();
            return result;
        }
    }
}
