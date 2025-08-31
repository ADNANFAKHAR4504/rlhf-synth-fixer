package imports.aws.sagemaker_app_image_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfigOutputReference")
public class SagemakerAppImageConfigJupyterLabImageConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerAppImageConfigJupyterLabImageConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerAppImageConfigJupyterLabImageConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerAppImageConfigJupyterLabImageConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putContainerConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigContainerConfig value) {
        software.amazon.jsii.Kernel.call(this, "putContainerConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFileSystemConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig value) {
        software.amazon.jsii.Kernel.call(this, "putFileSystemConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContainerConfig() {
        software.amazon.jsii.Kernel.call(this, "resetContainerConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileSystemConfig() {
        software.amazon.jsii.Kernel.call(this, "resetFileSystemConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigContainerConfigOutputReference getContainerConfig() {
        return software.amazon.jsii.Kernel.get(this, "containerConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigContainerConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfigOutputReference getFileSystemConfig() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigContainerConfig getContainerConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "containerConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigContainerConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig getFileSystemConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigJupyterLabImageConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
