package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference")
public class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpeakerSearchStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "speakerSearchStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVoiceToneAnalysisStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "voiceToneAnalysisStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpeakerSearchStatus() {
        return software.amazon.jsii.Kernel.get(this, "speakerSearchStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpeakerSearchStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "speakerSearchStatus", java.util.Objects.requireNonNull(value, "speakerSearchStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVoiceToneAnalysisStatus() {
        return software.amazon.jsii.Kernel.get(this, "voiceToneAnalysisStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVoiceToneAnalysisStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "voiceToneAnalysisStatus", java.util.Objects.requireNonNull(value, "voiceToneAnalysisStatus is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
