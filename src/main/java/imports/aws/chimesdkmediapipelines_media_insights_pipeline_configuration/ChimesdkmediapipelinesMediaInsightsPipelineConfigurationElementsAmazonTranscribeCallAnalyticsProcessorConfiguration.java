package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_code ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLanguageCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#call_analytics_stream_categories ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#call_analytics_stream_categories}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCallAnalyticsStreamCategories() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_identification_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_identification_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentIdentificationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentRedactionType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePartialResultsStabilization() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilterPartialResults() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_model_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_model_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLanguageModelName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#partial_results_stability ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#partial_results_stability}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPartialResultsStability() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#pii_entity_types ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#pii_entity_types}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPiiEntityTypes() {
        return null;
    }

    /**
     * post_call_analytics_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#post_call_analytics_settings ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#post_call_analytics_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings getPostCallAnalyticsSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_method ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVocabularyFilterMethod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVocabularyFilterName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVocabularyName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration> {
        java.lang.String languageCode;
        java.util.List<java.lang.String> callAnalyticsStreamCategories;
        java.lang.String contentIdentificationType;
        java.lang.String contentRedactionType;
        java.lang.Object enablePartialResultsStabilization;
        java.lang.Object filterPartialResults;
        java.lang.String languageModelName;
        java.lang.String partialResultsStability;
        java.lang.String piiEntityTypes;
        imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings postCallAnalyticsSettings;
        java.lang.String vocabularyFilterMethod;
        java.lang.String vocabularyFilterName;
        java.lang.String vocabularyName;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getLanguageCode}
         * @param languageCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_code ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder languageCode(java.lang.String languageCode) {
            this.languageCode = languageCode;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getCallAnalyticsStreamCategories}
         * @param callAnalyticsStreamCategories Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#call_analytics_stream_categories ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#call_analytics_stream_categories}.
         * @return {@code this}
         */
        public Builder callAnalyticsStreamCategories(java.util.List<java.lang.String> callAnalyticsStreamCategories) {
            this.callAnalyticsStreamCategories = callAnalyticsStreamCategories;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getContentIdentificationType}
         * @param contentIdentificationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_identification_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_identification_type}.
         * @return {@code this}
         */
        public Builder contentIdentificationType(java.lang.String contentIdentificationType) {
            this.contentIdentificationType = contentIdentificationType;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getContentRedactionType}
         * @param contentRedactionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_type}.
         * @return {@code this}
         */
        public Builder contentRedactionType(java.lang.String contentRedactionType) {
            this.contentRedactionType = contentRedactionType;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getEnablePartialResultsStabilization}
         * @param enablePartialResultsStabilization Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.
         * @return {@code this}
         */
        public Builder enablePartialResultsStabilization(java.lang.Boolean enablePartialResultsStabilization) {
            this.enablePartialResultsStabilization = enablePartialResultsStabilization;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getEnablePartialResultsStabilization}
         * @param enablePartialResultsStabilization Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.
         * @return {@code this}
         */
        public Builder enablePartialResultsStabilization(com.hashicorp.cdktf.IResolvable enablePartialResultsStabilization) {
            this.enablePartialResultsStabilization = enablePartialResultsStabilization;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getFilterPartialResults}
         * @param filterPartialResults Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.
         * @return {@code this}
         */
        public Builder filterPartialResults(java.lang.Boolean filterPartialResults) {
            this.filterPartialResults = filterPartialResults;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getFilterPartialResults}
         * @param filterPartialResults Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.
         * @return {@code this}
         */
        public Builder filterPartialResults(com.hashicorp.cdktf.IResolvable filterPartialResults) {
            this.filterPartialResults = filterPartialResults;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getLanguageModelName}
         * @param languageModelName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_model_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_model_name}.
         * @return {@code this}
         */
        public Builder languageModelName(java.lang.String languageModelName) {
            this.languageModelName = languageModelName;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getPartialResultsStability}
         * @param partialResultsStability Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#partial_results_stability ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#partial_results_stability}.
         * @return {@code this}
         */
        public Builder partialResultsStability(java.lang.String partialResultsStability) {
            this.partialResultsStability = partialResultsStability;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getPiiEntityTypes}
         * @param piiEntityTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#pii_entity_types ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#pii_entity_types}.
         * @return {@code this}
         */
        public Builder piiEntityTypes(java.lang.String piiEntityTypes) {
            this.piiEntityTypes = piiEntityTypes;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getPostCallAnalyticsSettings}
         * @param postCallAnalyticsSettings post_call_analytics_settings block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#post_call_analytics_settings ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#post_call_analytics_settings}
         * @return {@code this}
         */
        public Builder postCallAnalyticsSettings(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings postCallAnalyticsSettings) {
            this.postCallAnalyticsSettings = postCallAnalyticsSettings;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getVocabularyFilterMethod}
         * @param vocabularyFilterMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_method ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_method}.
         * @return {@code this}
         */
        public Builder vocabularyFilterMethod(java.lang.String vocabularyFilterMethod) {
            this.vocabularyFilterMethod = vocabularyFilterMethod;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getVocabularyFilterName}
         * @param vocabularyFilterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_name}.
         * @return {@code this}
         */
        public Builder vocabularyFilterName(java.lang.String vocabularyFilterName) {
            this.vocabularyFilterName = vocabularyFilterName;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration#getVocabularyName}
         * @param vocabularyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_name}.
         * @return {@code this}
         */
        public Builder vocabularyName(java.lang.String vocabularyName) {
            this.vocabularyName = vocabularyName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration {
        private final java.lang.String languageCode;
        private final java.util.List<java.lang.String> callAnalyticsStreamCategories;
        private final java.lang.String contentIdentificationType;
        private final java.lang.String contentRedactionType;
        private final java.lang.Object enablePartialResultsStabilization;
        private final java.lang.Object filterPartialResults;
        private final java.lang.String languageModelName;
        private final java.lang.String partialResultsStability;
        private final java.lang.String piiEntityTypes;
        private final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings postCallAnalyticsSettings;
        private final java.lang.String vocabularyFilterMethod;
        private final java.lang.String vocabularyFilterName;
        private final java.lang.String vocabularyName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.languageCode = software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.callAnalyticsStreamCategories = software.amazon.jsii.Kernel.get(this, "callAnalyticsStreamCategories", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.contentIdentificationType = software.amazon.jsii.Kernel.get(this, "contentIdentificationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentRedactionType = software.amazon.jsii.Kernel.get(this, "contentRedactionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enablePartialResultsStabilization = software.amazon.jsii.Kernel.get(this, "enablePartialResultsStabilization", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.filterPartialResults = software.amazon.jsii.Kernel.get(this, "filterPartialResults", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.languageModelName = software.amazon.jsii.Kernel.get(this, "languageModelName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.partialResultsStability = software.amazon.jsii.Kernel.get(this, "partialResultsStability", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.piiEntityTypes = software.amazon.jsii.Kernel.get(this, "piiEntityTypes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.postCallAnalyticsSettings = software.amazon.jsii.Kernel.get(this, "postCallAnalyticsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings.class));
            this.vocabularyFilterMethod = software.amazon.jsii.Kernel.get(this, "vocabularyFilterMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vocabularyFilterName = software.amazon.jsii.Kernel.get(this, "vocabularyFilterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vocabularyName = software.amazon.jsii.Kernel.get(this, "vocabularyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.languageCode = java.util.Objects.requireNonNull(builder.languageCode, "languageCode is required");
            this.callAnalyticsStreamCategories = builder.callAnalyticsStreamCategories;
            this.contentIdentificationType = builder.contentIdentificationType;
            this.contentRedactionType = builder.contentRedactionType;
            this.enablePartialResultsStabilization = builder.enablePartialResultsStabilization;
            this.filterPartialResults = builder.filterPartialResults;
            this.languageModelName = builder.languageModelName;
            this.partialResultsStability = builder.partialResultsStability;
            this.piiEntityTypes = builder.piiEntityTypes;
            this.postCallAnalyticsSettings = builder.postCallAnalyticsSettings;
            this.vocabularyFilterMethod = builder.vocabularyFilterMethod;
            this.vocabularyFilterName = builder.vocabularyFilterName;
            this.vocabularyName = builder.vocabularyName;
        }

        @Override
        public final java.lang.String getLanguageCode() {
            return this.languageCode;
        }

        @Override
        public final java.util.List<java.lang.String> getCallAnalyticsStreamCategories() {
            return this.callAnalyticsStreamCategories;
        }

        @Override
        public final java.lang.String getContentIdentificationType() {
            return this.contentIdentificationType;
        }

        @Override
        public final java.lang.String getContentRedactionType() {
            return this.contentRedactionType;
        }

        @Override
        public final java.lang.Object getEnablePartialResultsStabilization() {
            return this.enablePartialResultsStabilization;
        }

        @Override
        public final java.lang.Object getFilterPartialResults() {
            return this.filterPartialResults;
        }

        @Override
        public final java.lang.String getLanguageModelName() {
            return this.languageModelName;
        }

        @Override
        public final java.lang.String getPartialResultsStability() {
            return this.partialResultsStability;
        }

        @Override
        public final java.lang.String getPiiEntityTypes() {
            return this.piiEntityTypes;
        }

        @Override
        public final imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings getPostCallAnalyticsSettings() {
            return this.postCallAnalyticsSettings;
        }

        @Override
        public final java.lang.String getVocabularyFilterMethod() {
            return this.vocabularyFilterMethod;
        }

        @Override
        public final java.lang.String getVocabularyFilterName() {
            return this.vocabularyFilterName;
        }

        @Override
        public final java.lang.String getVocabularyName() {
            return this.vocabularyName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("languageCode", om.valueToTree(this.getLanguageCode()));
            if (this.getCallAnalyticsStreamCategories() != null) {
                data.set("callAnalyticsStreamCategories", om.valueToTree(this.getCallAnalyticsStreamCategories()));
            }
            if (this.getContentIdentificationType() != null) {
                data.set("contentIdentificationType", om.valueToTree(this.getContentIdentificationType()));
            }
            if (this.getContentRedactionType() != null) {
                data.set("contentRedactionType", om.valueToTree(this.getContentRedactionType()));
            }
            if (this.getEnablePartialResultsStabilization() != null) {
                data.set("enablePartialResultsStabilization", om.valueToTree(this.getEnablePartialResultsStabilization()));
            }
            if (this.getFilterPartialResults() != null) {
                data.set("filterPartialResults", om.valueToTree(this.getFilterPartialResults()));
            }
            if (this.getLanguageModelName() != null) {
                data.set("languageModelName", om.valueToTree(this.getLanguageModelName()));
            }
            if (this.getPartialResultsStability() != null) {
                data.set("partialResultsStability", om.valueToTree(this.getPartialResultsStability()));
            }
            if (this.getPiiEntityTypes() != null) {
                data.set("piiEntityTypes", om.valueToTree(this.getPiiEntityTypes()));
            }
            if (this.getPostCallAnalyticsSettings() != null) {
                data.set("postCallAnalyticsSettings", om.valueToTree(this.getPostCallAnalyticsSettings()));
            }
            if (this.getVocabularyFilterMethod() != null) {
                data.set("vocabularyFilterMethod", om.valueToTree(this.getVocabularyFilterMethod()));
            }
            if (this.getVocabularyFilterName() != null) {
                data.set("vocabularyFilterName", om.valueToTree(this.getVocabularyFilterName()));
            }
            if (this.getVocabularyName() != null) {
                data.set("vocabularyName", om.valueToTree(this.getVocabularyName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration.Jsii$Proxy) o;

            if (!languageCode.equals(that.languageCode)) return false;
            if (this.callAnalyticsStreamCategories != null ? !this.callAnalyticsStreamCategories.equals(that.callAnalyticsStreamCategories) : that.callAnalyticsStreamCategories != null) return false;
            if (this.contentIdentificationType != null ? !this.contentIdentificationType.equals(that.contentIdentificationType) : that.contentIdentificationType != null) return false;
            if (this.contentRedactionType != null ? !this.contentRedactionType.equals(that.contentRedactionType) : that.contentRedactionType != null) return false;
            if (this.enablePartialResultsStabilization != null ? !this.enablePartialResultsStabilization.equals(that.enablePartialResultsStabilization) : that.enablePartialResultsStabilization != null) return false;
            if (this.filterPartialResults != null ? !this.filterPartialResults.equals(that.filterPartialResults) : that.filterPartialResults != null) return false;
            if (this.languageModelName != null ? !this.languageModelName.equals(that.languageModelName) : that.languageModelName != null) return false;
            if (this.partialResultsStability != null ? !this.partialResultsStability.equals(that.partialResultsStability) : that.partialResultsStability != null) return false;
            if (this.piiEntityTypes != null ? !this.piiEntityTypes.equals(that.piiEntityTypes) : that.piiEntityTypes != null) return false;
            if (this.postCallAnalyticsSettings != null ? !this.postCallAnalyticsSettings.equals(that.postCallAnalyticsSettings) : that.postCallAnalyticsSettings != null) return false;
            if (this.vocabularyFilterMethod != null ? !this.vocabularyFilterMethod.equals(that.vocabularyFilterMethod) : that.vocabularyFilterMethod != null) return false;
            if (this.vocabularyFilterName != null ? !this.vocabularyFilterName.equals(that.vocabularyFilterName) : that.vocabularyFilterName != null) return false;
            return this.vocabularyName != null ? this.vocabularyName.equals(that.vocabularyName) : that.vocabularyName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.languageCode.hashCode();
            result = 31 * result + (this.callAnalyticsStreamCategories != null ? this.callAnalyticsStreamCategories.hashCode() : 0);
            result = 31 * result + (this.contentIdentificationType != null ? this.contentIdentificationType.hashCode() : 0);
            result = 31 * result + (this.contentRedactionType != null ? this.contentRedactionType.hashCode() : 0);
            result = 31 * result + (this.enablePartialResultsStabilization != null ? this.enablePartialResultsStabilization.hashCode() : 0);
            result = 31 * result + (this.filterPartialResults != null ? this.filterPartialResults.hashCode() : 0);
            result = 31 * result + (this.languageModelName != null ? this.languageModelName.hashCode() : 0);
            result = 31 * result + (this.partialResultsStability != null ? this.partialResultsStability.hashCode() : 0);
            result = 31 * result + (this.piiEntityTypes != null ? this.piiEntityTypes.hashCode() : 0);
            result = 31 * result + (this.postCallAnalyticsSettings != null ? this.postCallAnalyticsSettings.hashCode() : 0);
            result = 31 * result + (this.vocabularyFilterMethod != null ? this.vocabularyFilterMethod.hashCode() : 0);
            result = 31 * result + (this.vocabularyFilterName != null ? this.vocabularyFilterName.hashCode() : 0);
            result = 31 * result + (this.vocabularyName != null ? this.vocabularyName.hashCode() : 0);
            return result;
        }
    }
}
