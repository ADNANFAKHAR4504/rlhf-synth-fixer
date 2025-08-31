package imports.aws.sagemaker_app_image_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfigOutputReference")
public class SagemakerAppImageConfigKernelGatewayImageConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerAppImageConfigKernelGatewayImageConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerAppImageConfigKernelGatewayImageConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerAppImageConfigKernelGatewayImageConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putFileSystemConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig value) {
        software.amazon.jsii.Kernel.call(this, "putFileSystemConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKernelSpec(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putKernelSpec", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFileSystemConfig() {
        software.amazon.jsii.Kernel.call(this, "resetFileSystemConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfigOutputReference getFileSystemConfig() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecList getKernelSpec() {
        return software.amazon.jsii.Kernel.get(this, "kernelSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig getFileSystemConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKernelSpecInput() {
        return software.amazon.jsii.Kernel.get(this, "kernelSpecInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
