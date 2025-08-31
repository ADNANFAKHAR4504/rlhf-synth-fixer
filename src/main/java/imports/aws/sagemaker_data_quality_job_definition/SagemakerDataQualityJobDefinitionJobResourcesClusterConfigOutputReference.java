package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.302Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference")
public class SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetVolumeKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInstanceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSizeInGbInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeSizeInGbInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstanceCount() {
        return software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInstanceCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "instanceCount", java.util.Objects.requireNonNull(value, "instanceCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "volumeKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeKmsKeyId", java.util.Objects.requireNonNull(value, "volumeKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVolumeSizeInGb() {
        return software.amazon.jsii.Kernel.get(this, "volumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVolumeSizeInGb(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "volumeSizeInGb", java.util.Objects.requireNonNull(value, "volumeSizeInGb is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
