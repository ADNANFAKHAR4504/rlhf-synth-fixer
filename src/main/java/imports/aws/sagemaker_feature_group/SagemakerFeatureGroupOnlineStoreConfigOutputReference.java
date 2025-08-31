package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupOnlineStoreConfigOutputReference")
public class SagemakerFeatureGroupOnlineStoreConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerFeatureGroupOnlineStoreConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerFeatureGroupOnlineStoreConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerFeatureGroupOnlineStoreConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSecurityConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig value) {
        software.amazon.jsii.Kernel.call(this, "putSecurityConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTtlDuration(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration value) {
        software.amazon.jsii.Kernel.call(this, "putTtlDuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnableOnlineStore() {
        software.amazon.jsii.Kernel.call(this, "resetEnableOnlineStore", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityConfig() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageType() {
        software.amazon.jsii.Kernel.call(this, "resetStorageType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTtlDuration() {
        software.amazon.jsii.Kernel.call(this, "resetTtlDuration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfigOutputReference getSecurityConfig() {
        return software.amazon.jsii.Kernel.get(this, "securityConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDurationOutputReference getTtlDuration() {
        return software.amazon.jsii.Kernel.get(this, "ttlDuration", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableOnlineStoreInput() {
        return software.amazon.jsii.Kernel.get(this, "enableOnlineStoreInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig getSecurityConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "securityConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "storageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration getTtlDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "ttlDurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableOnlineStore() {
        return software.amazon.jsii.Kernel.get(this, "enableOnlineStore", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableOnlineStore(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableOnlineStore", java.util.Objects.requireNonNull(value, "enableOnlineStore is required"));
    }

    public void setEnableOnlineStore(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableOnlineStore", java.util.Objects.requireNonNull(value, "enableOnlineStore is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageType", java.util.Objects.requireNonNull(value, "storageType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
