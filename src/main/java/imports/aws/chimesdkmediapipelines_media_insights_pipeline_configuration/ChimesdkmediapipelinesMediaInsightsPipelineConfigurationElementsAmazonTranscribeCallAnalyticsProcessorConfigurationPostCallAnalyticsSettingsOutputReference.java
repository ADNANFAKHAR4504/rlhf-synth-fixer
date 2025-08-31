package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference")
public class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetContentRedactionOutput() {
        software.amazon.jsii.Kernel.call(this, "resetContentRedactionOutput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputEncryptionKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetOutputEncryptionKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentRedactionOutputInput() {
        return software.amazon.jsii.Kernel.get(this, "contentRedactionOutputInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dataAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputEncryptionKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "outputEncryptionKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "outputLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentRedactionOutput() {
        return software.amazon.jsii.Kernel.get(this, "contentRedactionOutput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentRedactionOutput(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentRedactionOutput", java.util.Objects.requireNonNull(value, "contentRedactionOutput is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "dataAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataAccessRoleArn", java.util.Objects.requireNonNull(value, "dataAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputEncryptionKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "outputEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputEncryptionKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputEncryptionKmsKeyId", java.util.Objects.requireNonNull(value, "outputEncryptionKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputLocation() {
        return software.amazon.jsii.Kernel.get(this, "outputLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputLocation", java.util.Objects.requireNonNull(value, "outputLocation is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
