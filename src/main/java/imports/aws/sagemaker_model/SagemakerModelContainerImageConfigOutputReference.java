package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.331Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelContainerImageConfigOutputReference")
public class SagemakerModelContainerImageConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerModelContainerImageConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerModelContainerImageConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerModelContainerImageConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRepositoryAuthConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig value) {
        software.amazon.jsii.Kernel.call(this, "putRepositoryAuthConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRepositoryAuthConfig() {
        software.amazon.jsii.Kernel.call(this, "resetRepositoryAuthConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfigOutputReference getRepositoryAuthConfig() {
        return software.amazon.jsii.Kernel.get(this, "repositoryAuthConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRepositoryAccessModeInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoryAccessModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig getRepositoryAuthConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoryAuthConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRepositoryAccessMode() {
        return software.amazon.jsii.Kernel.get(this, "repositoryAccessMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRepositoryAccessMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "repositoryAccessMode", java.util.Objects.requireNonNull(value, "repositoryAccessMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelContainerImageConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelContainerImageConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelContainerImageConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
