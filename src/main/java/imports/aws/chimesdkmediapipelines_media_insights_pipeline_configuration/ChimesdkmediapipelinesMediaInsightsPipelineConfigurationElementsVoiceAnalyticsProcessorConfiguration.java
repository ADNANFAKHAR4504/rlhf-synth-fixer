package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#speaker_search_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#speaker_search_status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSpeakerSearchStatus();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_tone_analysis_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_tone_analysis_status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVoiceToneAnalysisStatus();

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration> {
        java.lang.String speakerSearchStatus;
        java.lang.String voiceToneAnalysisStatus;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration#getSpeakerSearchStatus}
         * @param speakerSearchStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#speaker_search_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#speaker_search_status}. This parameter is required.
         * @return {@code this}
         */
        public Builder speakerSearchStatus(java.lang.String speakerSearchStatus) {
            this.speakerSearchStatus = speakerSearchStatus;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration#getVoiceToneAnalysisStatus}
         * @param voiceToneAnalysisStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_tone_analysis_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_tone_analysis_status}. This parameter is required.
         * @return {@code this}
         */
        public Builder voiceToneAnalysisStatus(java.lang.String voiceToneAnalysisStatus) {
            this.voiceToneAnalysisStatus = voiceToneAnalysisStatus;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration {
        private final java.lang.String speakerSearchStatus;
        private final java.lang.String voiceToneAnalysisStatus;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.speakerSearchStatus = software.amazon.jsii.Kernel.get(this, "speakerSearchStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.voiceToneAnalysisStatus = software.amazon.jsii.Kernel.get(this, "voiceToneAnalysisStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.speakerSearchStatus = java.util.Objects.requireNonNull(builder.speakerSearchStatus, "speakerSearchStatus is required");
            this.voiceToneAnalysisStatus = java.util.Objects.requireNonNull(builder.voiceToneAnalysisStatus, "voiceToneAnalysisStatus is required");
        }

        @Override
        public final java.lang.String getSpeakerSearchStatus() {
            return this.speakerSearchStatus;
        }

        @Override
        public final java.lang.String getVoiceToneAnalysisStatus() {
            return this.voiceToneAnalysisStatus;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("speakerSearchStatus", om.valueToTree(this.getSpeakerSearchStatus()));
            data.set("voiceToneAnalysisStatus", om.valueToTree(this.getVoiceToneAnalysisStatus()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration.Jsii$Proxy) o;

            if (!speakerSearchStatus.equals(that.speakerSearchStatus)) return false;
            return this.voiceToneAnalysisStatus.equals(that.voiceToneAnalysisStatus);
        }

        @Override
        public final int hashCode() {
            int result = this.speakerSearchStatus.hashCode();
            result = 31 * result + (this.voiceToneAnalysisStatus.hashCode());
            return result;
        }
    }
}
