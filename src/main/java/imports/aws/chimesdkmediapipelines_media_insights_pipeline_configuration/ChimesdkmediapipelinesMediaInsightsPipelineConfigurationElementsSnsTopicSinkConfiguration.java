package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInsightsTarget();

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration> {
        java.lang.String insightsTarget;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration#getInsightsTarget}
         * @param insightsTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}. This parameter is required.
         * @return {@code this}
         */
        public Builder insightsTarget(java.lang.String insightsTarget) {
            this.insightsTarget = insightsTarget;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration {
        private final java.lang.String insightsTarget;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.insightsTarget = software.amazon.jsii.Kernel.get(this, "insightsTarget", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.insightsTarget = java.util.Objects.requireNonNull(builder.insightsTarget, "insightsTarget is required");
        }

        @Override
        public final java.lang.String getInsightsTarget() {
            return this.insightsTarget;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("insightsTarget", om.valueToTree(this.getInsightsTarget()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration.Jsii$Proxy) o;

            return this.insightsTarget.equals(that.insightsTarget);
        }

        @Override
        public final int hashCode() {
            int result = this.insightsTarget.hashCode();
            return result;
        }
    }
}
