package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.323Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupFeatureDefinitionCollectionConfigOutputReference")
public class SagemakerFeatureGroupFeatureDefinitionCollectionConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerFeatureGroupFeatureDefinitionCollectionConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerFeatureGroupFeatureDefinitionCollectionConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerFeatureGroupFeatureDefinitionCollectionConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putVectorConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVectorConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetVectorConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVectorConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfigOutputReference getVectorConfig() {
        return software.amazon.jsii.Kernel.get(this, "vectorConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig getVectorConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vectorConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
