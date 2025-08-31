package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * issue_detection_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#issue_detection_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#issue_detection_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration getIssueDetectionConfiguration() {
        return null;
    }

    /**
     * keyword_match_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#keyword_match_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#keyword_match_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration getKeywordMatchConfiguration() {
        return null;
    }

    /**
     * sentiment_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration getSentimentConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules> {
        java.lang.String type;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration issueDetectionConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration keywordMatchConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration sentimentConfiguration;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules#getIssueDetectionConfiguration}
         * @param issueDetectionConfiguration issue_detection_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#issue_detection_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#issue_detection_configuration}
         * @return {@code this}
         */
        public Builder issueDetectionConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration issueDetectionConfiguration) {
            this.issueDetectionConfiguration = issueDetectionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules#getKeywordMatchConfiguration}
         * @param keywordMatchConfiguration keyword_match_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#keyword_match_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#keyword_match_configuration}
         * @return {@code this}
         */
        public Builder keywordMatchConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration keywordMatchConfiguration) {
            this.keywordMatchConfiguration = keywordMatchConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules#getSentimentConfiguration}
         * @param sentimentConfiguration sentiment_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_configuration}
         * @return {@code this}
         */
        public Builder sentimentConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration sentimentConfiguration) {
            this.sentimentConfiguration = sentimentConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules {
        private final java.lang.String type;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration issueDetectionConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration keywordMatchConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration sentimentConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.issueDetectionConfiguration = software.amazon.jsii.Kernel.get(this, "issueDetectionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration.class));
            this.keywordMatchConfiguration = software.amazon.jsii.Kernel.get(this, "keywordMatchConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration.class));
            this.sentimentConfiguration = software.amazon.jsii.Kernel.get(this, "sentimentConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.issueDetectionConfiguration = builder.issueDetectionConfiguration;
            this.keywordMatchConfiguration = builder.keywordMatchConfiguration;
            this.sentimentConfiguration = builder.sentimentConfiguration;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration getIssueDetectionConfiguration() {
            return this.issueDetectionConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration getKeywordMatchConfiguration() {
            return this.keywordMatchConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration getSentimentConfiguration() {
            return this.sentimentConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getIssueDetectionConfiguration() != null) {
                data.set("issueDetectionConfiguration", om.valueToTree(this.getIssueDetectionConfiguration()));
            }
            if (this.getKeywordMatchConfiguration() != null) {
                data.set("keywordMatchConfiguration", om.valueToTree(this.getKeywordMatchConfiguration()));
            }
            if (this.getSentimentConfiguration() != null) {
                data.set("sentimentConfiguration", om.valueToTree(this.getSentimentConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.issueDetectionConfiguration != null ? !this.issueDetectionConfiguration.equals(that.issueDetectionConfiguration) : that.issueDetectionConfiguration != null) return false;
            if (this.keywordMatchConfiguration != null ? !this.keywordMatchConfiguration.equals(that.keywordMatchConfiguration) : that.keywordMatchConfiguration != null) return false;
            return this.sentimentConfiguration != null ? this.sentimentConfiguration.equals(that.sentimentConfiguration) : that.sentimentConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.issueDetectionConfiguration != null ? this.issueDetectionConfiguration.hashCode() : 0);
            result = 31 * result + (this.keywordMatchConfiguration != null ? this.keywordMatchConfiguration.hashCode() : 0);
            result = 31 * result + (this.sentimentConfiguration != null ? this.sentimentConfiguration.hashCode() : 0);
            return result;
        }
    }
}
