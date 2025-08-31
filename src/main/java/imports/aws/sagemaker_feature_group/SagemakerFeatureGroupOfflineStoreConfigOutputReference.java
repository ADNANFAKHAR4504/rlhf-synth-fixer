package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupOfflineStoreConfigOutputReference")
public class SagemakerFeatureGroupOfflineStoreConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerFeatureGroupOfflineStoreConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerFeatureGroupOfflineStoreConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerFeatureGroupOfflineStoreConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDataCatalogConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig value) {
        software.amazon.jsii.Kernel.call(this, "putDataCatalogConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3StorageConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig value) {
        software.amazon.jsii.Kernel.call(this, "putS3StorageConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataCatalogConfig() {
        software.amazon.jsii.Kernel.call(this, "resetDataCatalogConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableGlueTableCreation() {
        software.amazon.jsii.Kernel.call(this, "resetDisableGlueTableCreation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTableFormat() {
        software.amazon.jsii.Kernel.call(this, "resetTableFormat", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfigOutputReference getDataCatalogConfig() {
        return software.amazon.jsii.Kernel.get(this, "dataCatalogConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigS3StorageConfigOutputReference getS3StorageConfig() {
        return software.amazon.jsii.Kernel.get(this, "s3StorageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigS3StorageConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig getDataCatalogConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "dataCatalogConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableGlueTableCreationInput() {
        return software.amazon.jsii.Kernel.get(this, "disableGlueTableCreationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig getS3StorageConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "s3StorageConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "tableFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableGlueTableCreation() {
        return software.amazon.jsii.Kernel.get(this, "disableGlueTableCreation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableGlueTableCreation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableGlueTableCreation", java.util.Objects.requireNonNull(value, "disableGlueTableCreation is required"));
    }

    public void setDisableGlueTableCreation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableGlueTableCreation", java.util.Objects.requireNonNull(value, "disableGlueTableCreation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTableFormat() {
        return software.amazon.jsii.Kernel.get(this, "tableFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTableFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tableFormat", java.util.Objects.requireNonNull(value, "tableFormat is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
