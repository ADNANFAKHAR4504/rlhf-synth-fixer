package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * amazon_transcribe_call_analytics_processor_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#amazon_transcribe_call_analytics_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#amazon_transcribe_call_analytics_processor_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration getAmazonTranscribeCallAnalyticsProcessorConfiguration() {
        return null;
    }

    /**
     * amazon_transcribe_processor_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#amazon_transcribe_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#amazon_transcribe_processor_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration getAmazonTranscribeProcessorConfiguration() {
        return null;
    }

    /**
     * kinesis_data_stream_sink_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#kinesis_data_stream_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#kinesis_data_stream_sink_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration getKinesisDataStreamSinkConfiguration() {
        return null;
    }

    /**
     * lambda_function_sink_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#lambda_function_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#lambda_function_sink_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration getLambdaFunctionSinkConfiguration() {
        return null;
    }

    /**
     * s3_recording_sink_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#s3_recording_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#s3_recording_sink_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration getS3RecordingSinkConfiguration() {
        return null;
    }

    /**
     * sns_topic_sink_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sns_topic_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sns_topic_sink_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration getSnsTopicSinkConfiguration() {
        return null;
    }

    /**
     * sqs_queue_sink_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sqs_queue_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sqs_queue_sink_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration getSqsQueueSinkConfiguration() {
        return null;
    }

    /**
     * voice_analytics_processor_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_analytics_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_analytics_processor_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration getVoiceAnalyticsProcessorConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements> {
        java.lang.String type;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration amazonTranscribeCallAnalyticsProcessorConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration amazonTranscribeProcessorConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration kinesisDataStreamSinkConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration lambdaFunctionSinkConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration s3RecordingSinkConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration snsTopicSinkConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration sqsQueueSinkConfiguration;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration voiceAnalyticsProcessorConfiguration;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getAmazonTranscribeCallAnalyticsProcessorConfiguration}
         * @param amazonTranscribeCallAnalyticsProcessorConfiguration amazon_transcribe_call_analytics_processor_configuration block.
         *                                                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#amazon_transcribe_call_analytics_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#amazon_transcribe_call_analytics_processor_configuration}
         * @return {@code this}
         */
        public Builder amazonTranscribeCallAnalyticsProcessorConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration amazonTranscribeCallAnalyticsProcessorConfiguration) {
            this.amazonTranscribeCallAnalyticsProcessorConfiguration = amazonTranscribeCallAnalyticsProcessorConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getAmazonTranscribeProcessorConfiguration}
         * @param amazonTranscribeProcessorConfiguration amazon_transcribe_processor_configuration block.
         *                                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#amazon_transcribe_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#amazon_transcribe_processor_configuration}
         * @return {@code this}
         */
        public Builder amazonTranscribeProcessorConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration amazonTranscribeProcessorConfiguration) {
            this.amazonTranscribeProcessorConfiguration = amazonTranscribeProcessorConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getKinesisDataStreamSinkConfiguration}
         * @param kinesisDataStreamSinkConfiguration kinesis_data_stream_sink_configuration block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#kinesis_data_stream_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#kinesis_data_stream_sink_configuration}
         * @return {@code this}
         */
        public Builder kinesisDataStreamSinkConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration kinesisDataStreamSinkConfiguration) {
            this.kinesisDataStreamSinkConfiguration = kinesisDataStreamSinkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getLambdaFunctionSinkConfiguration}
         * @param lambdaFunctionSinkConfiguration lambda_function_sink_configuration block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#lambda_function_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#lambda_function_sink_configuration}
         * @return {@code this}
         */
        public Builder lambdaFunctionSinkConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration lambdaFunctionSinkConfiguration) {
            this.lambdaFunctionSinkConfiguration = lambdaFunctionSinkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getS3RecordingSinkConfiguration}
         * @param s3RecordingSinkConfiguration s3_recording_sink_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#s3_recording_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#s3_recording_sink_configuration}
         * @return {@code this}
         */
        public Builder s3RecordingSinkConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration s3RecordingSinkConfiguration) {
            this.s3RecordingSinkConfiguration = s3RecordingSinkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getSnsTopicSinkConfiguration}
         * @param snsTopicSinkConfiguration sns_topic_sink_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sns_topic_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sns_topic_sink_configuration}
         * @return {@code this}
         */
        public Builder snsTopicSinkConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration snsTopicSinkConfiguration) {
            this.snsTopicSinkConfiguration = snsTopicSinkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getSqsQueueSinkConfiguration}
         * @param sqsQueueSinkConfiguration sqs_queue_sink_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sqs_queue_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sqs_queue_sink_configuration}
         * @return {@code this}
         */
        public Builder sqsQueueSinkConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration sqsQueueSinkConfiguration) {
            this.sqsQueueSinkConfiguration = sqsQueueSinkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements#getVoiceAnalyticsProcessorConfiguration}
         * @param voiceAnalyticsProcessorConfiguration voice_analytics_processor_configuration block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_analytics_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_analytics_processor_configuration}
         * @return {@code this}
         */
        public Builder voiceAnalyticsProcessorConfiguration(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration voiceAnalyticsProcessorConfiguration) {
            this.voiceAnalyticsProcessorConfiguration = voiceAnalyticsProcessorConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements {
        private final java.lang.String type;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration amazonTranscribeCallAnalyticsProcessorConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration amazonTranscribeProcessorConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration kinesisDataStreamSinkConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration lambdaFunctionSinkConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration s3RecordingSinkConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration snsTopicSinkConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration sqsQueueSinkConfiguration;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration voiceAnalyticsProcessorConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.amazonTranscribeCallAnalyticsProcessorConfiguration = software.amazon.jsii.Kernel.get(this, "amazonTranscribeCallAnalyticsProcessorConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration.class));
            this.amazonTranscribeProcessorConfiguration = software.amazon.jsii.Kernel.get(this, "amazonTranscribeProcessorConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration.class));
            this.kinesisDataStreamSinkConfiguration = software.amazon.jsii.Kernel.get(this, "kinesisDataStreamSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration.class));
            this.lambdaFunctionSinkConfiguration = software.amazon.jsii.Kernel.get(this, "lambdaFunctionSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration.class));
            this.s3RecordingSinkConfiguration = software.amazon.jsii.Kernel.get(this, "s3RecordingSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration.class));
            this.snsTopicSinkConfiguration = software.amazon.jsii.Kernel.get(this, "snsTopicSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration.class));
            this.sqsQueueSinkConfiguration = software.amazon.jsii.Kernel.get(this, "sqsQueueSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration.class));
            this.voiceAnalyticsProcessorConfiguration = software.amazon.jsii.Kernel.get(this, "voiceAnalyticsProcessorConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.amazonTranscribeCallAnalyticsProcessorConfiguration = builder.amazonTranscribeCallAnalyticsProcessorConfiguration;
            this.amazonTranscribeProcessorConfiguration = builder.amazonTranscribeProcessorConfiguration;
            this.kinesisDataStreamSinkConfiguration = builder.kinesisDataStreamSinkConfiguration;
            this.lambdaFunctionSinkConfiguration = builder.lambdaFunctionSinkConfiguration;
            this.s3RecordingSinkConfiguration = builder.s3RecordingSinkConfiguration;
            this.snsTopicSinkConfiguration = builder.snsTopicSinkConfiguration;
            this.sqsQueueSinkConfiguration = builder.sqsQueueSinkConfiguration;
            this.voiceAnalyticsProcessorConfiguration = builder.voiceAnalyticsProcessorConfiguration;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration getAmazonTranscribeCallAnalyticsProcessorConfiguration() {
            return this.amazonTranscribeCallAnalyticsProcessorConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration getAmazonTranscribeProcessorConfiguration() {
            return this.amazonTranscribeProcessorConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration getKinesisDataStreamSinkConfiguration() {
            return this.kinesisDataStreamSinkConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration getLambdaFunctionSinkConfiguration() {
            return this.lambdaFunctionSinkConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration getS3RecordingSinkConfiguration() {
            return this.s3RecordingSinkConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration getSnsTopicSinkConfiguration() {
            return this.snsTopicSinkConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration getSqsQueueSinkConfiguration() {
            return this.sqsQueueSinkConfiguration;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration getVoiceAnalyticsProcessorConfiguration() {
            return this.voiceAnalyticsProcessorConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getAmazonTranscribeCallAnalyticsProcessorConfiguration() != null) {
                data.set("amazonTranscribeCallAnalyticsProcessorConfiguration", om.valueToTree(this.getAmazonTranscribeCallAnalyticsProcessorConfiguration()));
            }
            if (this.getAmazonTranscribeProcessorConfiguration() != null) {
                data.set("amazonTranscribeProcessorConfiguration", om.valueToTree(this.getAmazonTranscribeProcessorConfiguration()));
            }
            if (this.getKinesisDataStreamSinkConfiguration() != null) {
                data.set("kinesisDataStreamSinkConfiguration", om.valueToTree(this.getKinesisDataStreamSinkConfiguration()));
            }
            if (this.getLambdaFunctionSinkConfiguration() != null) {
                data.set("lambdaFunctionSinkConfiguration", om.valueToTree(this.getLambdaFunctionSinkConfiguration()));
            }
            if (this.getS3RecordingSinkConfiguration() != null) {
                data.set("s3RecordingSinkConfiguration", om.valueToTree(this.getS3RecordingSinkConfiguration()));
            }
            if (this.getSnsTopicSinkConfiguration() != null) {
                data.set("snsTopicSinkConfiguration", om.valueToTree(this.getSnsTopicSinkConfiguration()));
            }
            if (this.getSqsQueueSinkConfiguration() != null) {
                data.set("sqsQueueSinkConfiguration", om.valueToTree(this.getSqsQueueSinkConfiguration()));
            }
            if (this.getVoiceAnalyticsProcessorConfiguration() != null) {
                data.set("voiceAnalyticsProcessorConfiguration", om.valueToTree(this.getVoiceAnalyticsProcessorConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.amazonTranscribeCallAnalyticsProcessorConfiguration != null ? !this.amazonTranscribeCallAnalyticsProcessorConfiguration.equals(that.amazonTranscribeCallAnalyticsProcessorConfiguration) : that.amazonTranscribeCallAnalyticsProcessorConfiguration != null) return false;
            if (this.amazonTranscribeProcessorConfiguration != null ? !this.amazonTranscribeProcessorConfiguration.equals(that.amazonTranscribeProcessorConfiguration) : that.amazonTranscribeProcessorConfiguration != null) return false;
            if (this.kinesisDataStreamSinkConfiguration != null ? !this.kinesisDataStreamSinkConfiguration.equals(that.kinesisDataStreamSinkConfiguration) : that.kinesisDataStreamSinkConfiguration != null) return false;
            if (this.lambdaFunctionSinkConfiguration != null ? !this.lambdaFunctionSinkConfiguration.equals(that.lambdaFunctionSinkConfiguration) : that.lambdaFunctionSinkConfiguration != null) return false;
            if (this.s3RecordingSinkConfiguration != null ? !this.s3RecordingSinkConfiguration.equals(that.s3RecordingSinkConfiguration) : that.s3RecordingSinkConfiguration != null) return false;
            if (this.snsTopicSinkConfiguration != null ? !this.snsTopicSinkConfiguration.equals(that.snsTopicSinkConfiguration) : that.snsTopicSinkConfiguration != null) return false;
            if (this.sqsQueueSinkConfiguration != null ? !this.sqsQueueSinkConfiguration.equals(that.sqsQueueSinkConfiguration) : that.sqsQueueSinkConfiguration != null) return false;
            return this.voiceAnalyticsProcessorConfiguration != null ? this.voiceAnalyticsProcessorConfiguration.equals(that.voiceAnalyticsProcessorConfiguration) : that.voiceAnalyticsProcessorConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.amazonTranscribeCallAnalyticsProcessorConfiguration != null ? this.amazonTranscribeCallAnalyticsProcessorConfiguration.hashCode() : 0);
            result = 31 * result + (this.amazonTranscribeProcessorConfiguration != null ? this.amazonTranscribeProcessorConfiguration.hashCode() : 0);
            result = 31 * result + (this.kinesisDataStreamSinkConfiguration != null ? this.kinesisDataStreamSinkConfiguration.hashCode() : 0);
            result = 31 * result + (this.lambdaFunctionSinkConfiguration != null ? this.lambdaFunctionSinkConfiguration.hashCode() : 0);
            result = 31 * result + (this.s3RecordingSinkConfiguration != null ? this.s3RecordingSinkConfiguration.hashCode() : 0);
            result = 31 * result + (this.snsTopicSinkConfiguration != null ? this.snsTopicSinkConfiguration.hashCode() : 0);
            result = 31 * result + (this.sqsQueueSinkConfiguration != null ? this.sqsQueueSinkConfiguration.hashCode() : 0);
            result = 31 * result + (this.voiceAnalyticsProcessorConfiguration != null ? this.voiceAnalyticsProcessorConfiguration.hashCode() : 0);
            return result;
        }
    }
}
