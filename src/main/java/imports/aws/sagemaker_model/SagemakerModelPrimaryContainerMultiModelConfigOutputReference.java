package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.333Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelPrimaryContainerMultiModelConfigOutputReference")
public class SagemakerModelPrimaryContainerMultiModelConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerModelPrimaryContainerMultiModelConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerModelPrimaryContainerMultiModelConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerModelPrimaryContainerMultiModelConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetModelCacheSetting() {
        software.amazon.jsii.Kernel.call(this, "resetModelCacheSetting", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModelCacheSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "modelCacheSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getModelCacheSetting() {
        return software.amazon.jsii.Kernel.get(this, "modelCacheSetting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setModelCacheSetting(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "modelCacheSetting", java.util.Objects.requireNonNull(value, "modelCacheSetting is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
