package imports.aws.sagemaker_hub;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.329Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerHub.SagemakerHubS3StorageConfigOutputReference")
public class SagemakerHubS3StorageConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerHubS3StorageConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerHubS3StorageConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerHubS3StorageConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetS3OutputPath() {
        software.amazon.jsii.Kernel.call(this, "resetS3OutputPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3OutputPathInput() {
        return software.amazon.jsii.Kernel.get(this, "s3OutputPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3OutputPath() {
        return software.amazon.jsii.Kernel.get(this, "s3OutputPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3OutputPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3OutputPath", java.util.Objects.requireNonNull(value, "s3OutputPath is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_hub.SagemakerHubS3StorageConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_hub.SagemakerHubS3StorageConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_hub.SagemakerHubS3StorageConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
