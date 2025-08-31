package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.210Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSentimentType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#time_period ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#time_period}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTimePeriod();

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration> {
        java.lang.String ruleName;
        java.lang.String sentimentType;
        java.lang.Number timePeriod;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration#getRuleName}
         * @param ruleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleName(java.lang.String ruleName) {
            this.ruleName = ruleName;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration#getSentimentType}
         * @param sentimentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder sentimentType(java.lang.String sentimentType) {
            this.sentimentType = sentimentType;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration#getTimePeriod}
         * @param timePeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#time_period ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#time_period}. This parameter is required.
         * @return {@code this}
         */
        public Builder timePeriod(java.lang.Number timePeriod) {
            this.timePeriod = timePeriod;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration {
        private final java.lang.String ruleName;
        private final java.lang.String sentimentType;
        private final java.lang.Number timePeriod;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ruleName = software.amazon.jsii.Kernel.get(this, "ruleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sentimentType = software.amazon.jsii.Kernel.get(this, "sentimentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timePeriod = software.amazon.jsii.Kernel.get(this, "timePeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ruleName = java.util.Objects.requireNonNull(builder.ruleName, "ruleName is required");
            this.sentimentType = java.util.Objects.requireNonNull(builder.sentimentType, "sentimentType is required");
            this.timePeriod = java.util.Objects.requireNonNull(builder.timePeriod, "timePeriod is required");
        }

        @Override
        public final java.lang.String getRuleName() {
            return this.ruleName;
        }

        @Override
        public final java.lang.String getSentimentType() {
            return this.sentimentType;
        }

        @Override
        public final java.lang.Number getTimePeriod() {
            return this.timePeriod;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ruleName", om.valueToTree(this.getRuleName()));
            data.set("sentimentType", om.valueToTree(this.getSentimentType()));
            data.set("timePeriod", om.valueToTree(this.getTimePeriod()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration.Jsii$Proxy) o;

            if (!ruleName.equals(that.ruleName)) return false;
            if (!sentimentType.equals(that.sentimentType)) return false;
            return this.timePeriod.equals(that.timePeriod);
        }

        @Override
        public final int hashCode() {
            int result = this.ruleName.hashCode();
            result = 31 * result + (this.sentimentType.hashCode());
            result = 31 * result + (this.timePeriod.hashCode());
            return result;
        }
    }
}
