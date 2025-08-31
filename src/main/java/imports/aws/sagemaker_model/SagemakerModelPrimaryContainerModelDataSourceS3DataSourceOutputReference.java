package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.332Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference")
public class SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putModelAccessConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig value) {
        software.amazon.jsii.Kernel.call(this, "putModelAccessConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetModelAccessConfig() {
        software.amazon.jsii.Kernel.call(this, "resetModelAccessConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference getModelAccessConfig() {
        return software.amazon.jsii.Kernel.get(this, "modelAccessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompressionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "compressionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig getModelAccessConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "modelAccessConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3DataTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "s3DataTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "s3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompressionType() {
        return software.amazon.jsii.Kernel.get(this, "compressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompressionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "compressionType", java.util.Objects.requireNonNull(value, "compressionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3DataType() {
        return software.amazon.jsii.Kernel.get(this, "s3DataType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3DataType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3DataType", java.util.Objects.requireNonNull(value, "s3DataType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Uri", java.util.Objects.requireNonNull(value, "s3Uri is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceS3DataSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
