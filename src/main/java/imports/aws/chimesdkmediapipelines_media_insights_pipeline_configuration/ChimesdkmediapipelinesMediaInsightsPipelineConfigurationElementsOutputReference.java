package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference")
public class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAmazonTranscribeCallAnalyticsProcessorConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAmazonTranscribeCallAnalyticsProcessorConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAmazonTranscribeProcessorConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAmazonTranscribeProcessorConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisDataStreamSinkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisDataStreamSinkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaFunctionSinkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putLambdaFunctionSinkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3RecordingSinkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putS3RecordingSinkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnsTopicSinkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSnsTopicSinkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSqsQueueSinkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSqsQueueSinkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVoiceAnalyticsProcessorConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putVoiceAnalyticsProcessorConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmazonTranscribeCallAnalyticsProcessorConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAmazonTranscribeCallAnalyticsProcessorConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAmazonTranscribeProcessorConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAmazonTranscribeProcessorConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisDataStreamSinkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisDataStreamSinkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFunctionSinkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionSinkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3RecordingSinkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetS3RecordingSinkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnsTopicSinkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSnsTopicSinkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsQueueSinkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSqsQueueSinkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVoiceAnalyticsProcessorConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetVoiceAnalyticsProcessorConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference getAmazonTranscribeCallAnalyticsProcessorConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "amazonTranscribeCallAnalyticsProcessorConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfigurationOutputReference getAmazonTranscribeProcessorConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "amazonTranscribeProcessorConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfigurationOutputReference getKinesisDataStreamSinkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "kinesisDataStreamSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfigurationOutputReference getLambdaFunctionSinkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfigurationOutputReference getS3RecordingSinkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "s3RecordingSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfigurationOutputReference getSnsTopicSinkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "snsTopicSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfigurationOutputReference getSqsQueueSinkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "sqsQueueSinkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference getVoiceAnalyticsProcessorConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "voiceAnalyticsProcessorConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration getAmazonTranscribeCallAnalyticsProcessorConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "amazonTranscribeCallAnalyticsProcessorConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration getAmazonTranscribeProcessorConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "amazonTranscribeProcessorConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration getKinesisDataStreamSinkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisDataStreamSinkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration getLambdaFunctionSinkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionSinkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration getS3RecordingSinkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3RecordingSinkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration getSnsTopicSinkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "snsTopicSinkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration getSqsQueueSinkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsQueueSinkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration getVoiceAnalyticsProcessorConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "voiceAnalyticsProcessorConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
