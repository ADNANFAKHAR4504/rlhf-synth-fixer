package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.323Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupFeatureDefinitionOutputReference")
public class SagemakerFeatureGroupFeatureDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerFeatureGroupFeatureDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerFeatureGroupFeatureDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SagemakerFeatureGroupFeatureDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCollectionConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCollectionConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCollectionConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCollectionConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCollectionType() {
        software.amazon.jsii.Kernel.call(this, "resetCollectionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFeatureName() {
        software.amazon.jsii.Kernel.call(this, "resetFeatureName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFeatureType() {
        software.amazon.jsii.Kernel.call(this, "resetFeatureType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigOutputReference getCollectionConfig() {
        return software.amazon.jsii.Kernel.get(this, "collectionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig getCollectionConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "collectionConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCollectionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "collectionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFeatureNameInput() {
        return software.amazon.jsii.Kernel.get(this, "featureNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFeatureTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "featureTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCollectionType() {
        return software.amazon.jsii.Kernel.get(this, "collectionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCollectionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "collectionType", java.util.Objects.requireNonNull(value, "collectionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFeatureName() {
        return software.amazon.jsii.Kernel.get(this, "featureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFeatureName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "featureName", java.util.Objects.requireNonNull(value, "featureName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFeatureType() {
        return software.amazon.jsii.Kernel.get(this, "featureType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFeatureType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "featureType", java.util.Objects.requireNonNull(value, "featureType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
