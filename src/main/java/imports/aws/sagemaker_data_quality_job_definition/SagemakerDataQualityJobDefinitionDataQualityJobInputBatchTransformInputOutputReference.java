package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.302Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference")
public class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDatasetFormat(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat value) {
        software.amazon.jsii.Kernel.call(this, "putDatasetFormat", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetLocalPath() {
        software.amazon.jsii.Kernel.call(this, "resetLocalPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3DataDistributionType() {
        software.amazon.jsii.Kernel.call(this, "resetS3DataDistributionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3InputMode() {
        software.amazon.jsii.Kernel.call(this, "resetS3InputMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatOutputReference getDatasetFormat() {
        return software.amazon.jsii.Kernel.get(this, "datasetFormat", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataCapturedDestinationS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "dataCapturedDestinationS3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat getDatasetFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "datasetFormatInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalPathInput() {
        return software.amazon.jsii.Kernel.get(this, "localPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3DataDistributionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "s3DataDistributionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3InputModeInput() {
        return software.amazon.jsii.Kernel.get(this, "s3InputModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataCapturedDestinationS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "dataCapturedDestinationS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataCapturedDestinationS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataCapturedDestinationS3Uri", java.util.Objects.requireNonNull(value, "dataCapturedDestinationS3Uri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalPath() {
        return software.amazon.jsii.Kernel.get(this, "localPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localPath", java.util.Objects.requireNonNull(value, "localPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3DataDistributionType() {
        return software.amazon.jsii.Kernel.get(this, "s3DataDistributionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3DataDistributionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3DataDistributionType", java.util.Objects.requireNonNull(value, "s3DataDistributionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3InputMode() {
        return software.amazon.jsii.Kernel.get(this, "s3InputMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3InputMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3InputMode", java.util.Objects.requireNonNull(value, "s3InputMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
