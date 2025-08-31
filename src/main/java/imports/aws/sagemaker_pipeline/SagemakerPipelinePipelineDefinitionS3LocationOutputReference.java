package imports.aws.sagemaker_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.339Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerPipeline.SagemakerPipelinePipelineDefinitionS3LocationOutputReference")
public class SagemakerPipelinePipelineDefinitionS3LocationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerPipelinePipelineDefinitionS3LocationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerPipelinePipelineDefinitionS3LocationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerPipelinePipelineDefinitionS3LocationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetVersionId() {
        software.amazon.jsii.Kernel.call(this, "resetVersionId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "objectKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "versionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucket() {
        return software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucket", java.util.Objects.requireNonNull(value, "bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectKey() {
        return software.amazon.jsii.Kernel.get(this, "objectKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectKey", java.util.Objects.requireNonNull(value, "objectKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionId() {
        return software.amazon.jsii.Kernel.get(this, "versionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "versionId", java.util.Objects.requireNonNull(value, "versionId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
