package imports.aws.s3_bucket_server_side_encryption_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationRuleAOutputReference")
public class S3BucketServerSideEncryptionConfigurationRuleAOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketServerSideEncryptionConfigurationRuleAOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketServerSideEncryptionConfigurationRuleAOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public S3BucketServerSideEncryptionConfigurationRuleAOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putApplyServerSideEncryptionByDefault(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA value) {
        software.amazon.jsii.Kernel.call(this, "putApplyServerSideEncryptionByDefault", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApplyServerSideEncryptionByDefault() {
        software.amazon.jsii.Kernel.call(this, "resetApplyServerSideEncryptionByDefault", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketKeyEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetBucketKeyEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultAOutputReference getApplyServerSideEncryptionByDefault() {
        return software.amazon.jsii.Kernel.get(this, "applyServerSideEncryptionByDefault", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultAOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA getApplyServerSideEncryptionByDefaultInput() {
        return software.amazon.jsii.Kernel.get(this, "applyServerSideEncryptionByDefaultInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBucketKeyEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketKeyEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBucketKeyEnabled() {
        return software.amazon.jsii.Kernel.get(this, "bucketKeyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBucketKeyEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "bucketKeyEnabled", java.util.Objects.requireNonNull(value, "bucketKeyEnabled is required"));
    }

    public void setBucketKeyEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "bucketKeyEnabled", java.util.Objects.requireNonNull(value, "bucketKeyEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleA value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
