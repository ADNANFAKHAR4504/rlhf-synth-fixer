package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference")
public class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPostCallAnalyticsSettings(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings value) {
        software.amazon.jsii.Kernel.call(this, "putPostCallAnalyticsSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCallAnalyticsStreamCategories() {
        software.amazon.jsii.Kernel.call(this, "resetCallAnalyticsStreamCategories", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentIdentificationType() {
        software.amazon.jsii.Kernel.call(this, "resetContentIdentificationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentRedactionType() {
        software.amazon.jsii.Kernel.call(this, "resetContentRedactionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnablePartialResultsStabilization() {
        software.amazon.jsii.Kernel.call(this, "resetEnablePartialResultsStabilization", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterPartialResults() {
        software.amazon.jsii.Kernel.call(this, "resetFilterPartialResults", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLanguageModelName() {
        software.amazon.jsii.Kernel.call(this, "resetLanguageModelName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPartialResultsStability() {
        software.amazon.jsii.Kernel.call(this, "resetPartialResultsStability", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPiiEntityTypes() {
        software.amazon.jsii.Kernel.call(this, "resetPiiEntityTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPostCallAnalyticsSettings() {
        software.amazon.jsii.Kernel.call(this, "resetPostCallAnalyticsSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVocabularyFilterMethod() {
        software.amazon.jsii.Kernel.call(this, "resetVocabularyFilterMethod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVocabularyFilterName() {
        software.amazon.jsii.Kernel.call(this, "resetVocabularyFilterName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVocabularyName() {
        software.amazon.jsii.Kernel.call(this, "resetVocabularyName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference getPostCallAnalyticsSettings() {
        return software.amazon.jsii.Kernel.get(this, "postCallAnalyticsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCallAnalyticsStreamCategoriesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "callAnalyticsStreamCategoriesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentIdentificationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "contentIdentificationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentRedactionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "contentRedactionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnablePartialResultsStabilizationInput() {
        return software.amazon.jsii.Kernel.get(this, "enablePartialResultsStabilizationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFilterPartialResultsInput() {
        return software.amazon.jsii.Kernel.get(this, "filterPartialResultsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "languageCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageModelNameInput() {
        return software.amazon.jsii.Kernel.get(this, "languageModelNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPartialResultsStabilityInput() {
        return software.amazon.jsii.Kernel.get(this, "partialResultsStabilityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPiiEntityTypesInput() {
        return software.amazon.jsii.Kernel.get(this, "piiEntityTypesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings getPostCallAnalyticsSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "postCallAnalyticsSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVocabularyFilterMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "vocabularyFilterMethodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVocabularyFilterNameInput() {
        return software.amazon.jsii.Kernel.get(this, "vocabularyFilterNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVocabularyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "vocabularyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCallAnalyticsStreamCategories() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "callAnalyticsStreamCategories", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCallAnalyticsStreamCategories(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "callAnalyticsStreamCategories", java.util.Objects.requireNonNull(value, "callAnalyticsStreamCategories is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentIdentificationType() {
        return software.amazon.jsii.Kernel.get(this, "contentIdentificationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentIdentificationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentIdentificationType", java.util.Objects.requireNonNull(value, "contentIdentificationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentRedactionType() {
        return software.amazon.jsii.Kernel.get(this, "contentRedactionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentRedactionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentRedactionType", java.util.Objects.requireNonNull(value, "contentRedactionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnablePartialResultsStabilization() {
        return software.amazon.jsii.Kernel.get(this, "enablePartialResultsStabilization", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnablePartialResultsStabilization(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enablePartialResultsStabilization", java.util.Objects.requireNonNull(value, "enablePartialResultsStabilization is required"));
    }

    public void setEnablePartialResultsStabilization(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enablePartialResultsStabilization", java.util.Objects.requireNonNull(value, "enablePartialResultsStabilization is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFilterPartialResults() {
        return software.amazon.jsii.Kernel.get(this, "filterPartialResults", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFilterPartialResults(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "filterPartialResults", java.util.Objects.requireNonNull(value, "filterPartialResults is required"));
    }

    public void setFilterPartialResults(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "filterPartialResults", java.util.Objects.requireNonNull(value, "filterPartialResults is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLanguageCode() {
        return software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLanguageCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "languageCode", java.util.Objects.requireNonNull(value, "languageCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLanguageModelName() {
        return software.amazon.jsii.Kernel.get(this, "languageModelName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLanguageModelName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "languageModelName", java.util.Objects.requireNonNull(value, "languageModelName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPartialResultsStability() {
        return software.amazon.jsii.Kernel.get(this, "partialResultsStability", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPartialResultsStability(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "partialResultsStability", java.util.Objects.requireNonNull(value, "partialResultsStability is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPiiEntityTypes() {
        return software.amazon.jsii.Kernel.get(this, "piiEntityTypes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPiiEntityTypes(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "piiEntityTypes", java.util.Objects.requireNonNull(value, "piiEntityTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVocabularyFilterMethod() {
        return software.amazon.jsii.Kernel.get(this, "vocabularyFilterMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVocabularyFilterMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vocabularyFilterMethod", java.util.Objects.requireNonNull(value, "vocabularyFilterMethod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVocabularyFilterName() {
        return software.amazon.jsii.Kernel.get(this, "vocabularyFilterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVocabularyFilterName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vocabularyFilterName", java.util.Objects.requireNonNull(value, "vocabularyFilterName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVocabularyName() {
        return software.amazon.jsii.Kernel.get(this, "vocabularyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVocabularyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vocabularyName", java.util.Objects.requireNonNull(value, "vocabularyName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
