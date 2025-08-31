package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.332Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference")
public class SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAcceptEulaInput() {
        return software.amazon.jsii.Kernel.get(this, "acceptEulaInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAcceptEula() {
        return software.amazon.jsii.Kernel.get(this, "acceptEula", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAcceptEula(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "acceptEula", java.util.Objects.requireNonNull(value, "acceptEula is required"));
    }

    public void setAcceptEula(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "acceptEula", java.util.Objects.requireNonNull(value, "acceptEula is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
