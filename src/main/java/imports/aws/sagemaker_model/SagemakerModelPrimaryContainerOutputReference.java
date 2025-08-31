package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.333Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelPrimaryContainerOutputReference")
public class SagemakerModelPrimaryContainerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerModelPrimaryContainerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerModelPrimaryContainerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerModelPrimaryContainerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putImageConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig value) {
        software.amazon.jsii.Kernel.call(this, "putImageConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putModelDataSource(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource value) {
        software.amazon.jsii.Kernel.call(this, "putModelDataSource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMultiModelConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig value) {
        software.amazon.jsii.Kernel.call(this, "putMultiModelConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContainerHostname() {
        software.amazon.jsii.Kernel.call(this, "resetContainerHostname", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironment() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImage() {
        software.amazon.jsii.Kernel.call(this, "resetImage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageConfig() {
        software.amazon.jsii.Kernel.call(this, "resetImageConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInferenceSpecificationName() {
        software.amazon.jsii.Kernel.call(this, "resetInferenceSpecificationName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMode() {
        software.amazon.jsii.Kernel.call(this, "resetMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetModelDataSource() {
        software.amazon.jsii.Kernel.call(this, "resetModelDataSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetModelDataUrl() {
        software.amazon.jsii.Kernel.call(this, "resetModelDataUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetModelPackageName() {
        software.amazon.jsii.Kernel.call(this, "resetModelPackageName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiModelConfig() {
        software.amazon.jsii.Kernel.call(this, "resetMultiModelConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfigOutputReference getImageConfig() {
        return software.amazon.jsii.Kernel.get(this, "imageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceOutputReference getModelDataSource() {
        return software.amazon.jsii.Kernel.get(this, "modelDataSource", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfigOutputReference getMultiModelConfig() {
        return software.amazon.jsii.Kernel.get(this, "multiModelConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContainerHostnameInput() {
        return software.amazon.jsii.Kernel.get(this, "containerHostnameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "environmentInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig getImageConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "imageConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageInput() {
        return software.amazon.jsii.Kernel.get(this, "imageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInferenceSpecificationNameInput() {
        return software.amazon.jsii.Kernel.get(this, "inferenceSpecificationNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModeInput() {
        return software.amazon.jsii.Kernel.get(this, "modeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource getModelDataSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "modelDataSourceInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModelDataUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "modelDataUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModelPackageNameInput() {
        return software.amazon.jsii.Kernel.get(this, "modelPackageNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig getMultiModelConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "multiModelConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContainerHostname() {
        return software.amazon.jsii.Kernel.get(this, "containerHostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContainerHostname(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "containerHostname", java.util.Objects.requireNonNull(value, "containerHostname is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getEnvironment() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnvironment(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "environment", java.util.Objects.requireNonNull(value, "environment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImage() {
        return software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "image", java.util.Objects.requireNonNull(value, "image is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInferenceSpecificationName() {
        return software.amazon.jsii.Kernel.get(this, "inferenceSpecificationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInferenceSpecificationName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inferenceSpecificationName", java.util.Objects.requireNonNull(value, "inferenceSpecificationName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMode() {
        return software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mode", java.util.Objects.requireNonNull(value, "mode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getModelDataUrl() {
        return software.amazon.jsii.Kernel.get(this, "modelDataUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setModelDataUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "modelDataUrl", java.util.Objects.requireNonNull(value, "modelDataUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getModelPackageName() {
        return software.amazon.jsii.Kernel.get(this, "modelPackageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setModelPackageName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "modelPackageName", java.util.Objects.requireNonNull(value, "modelPackageName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainer getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainer.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainer value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
