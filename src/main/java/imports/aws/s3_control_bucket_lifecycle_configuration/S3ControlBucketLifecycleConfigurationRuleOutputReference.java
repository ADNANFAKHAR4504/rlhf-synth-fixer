package imports.aws.s3_control_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.276Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlBucketLifecycleConfiguration.S3ControlBucketLifecycleConfigurationRuleOutputReference")
public class S3ControlBucketLifecycleConfigurationRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlBucketLifecycleConfigurationRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlBucketLifecycleConfigurationRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public S3ControlBucketLifecycleConfigurationRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAbortIncompleteMultipartUpload(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload value) {
        software.amazon.jsii.Kernel.call(this, "putAbortIncompleteMultipartUpload", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExpiration(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration value) {
        software.amazon.jsii.Kernel.call(this, "putExpiration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilter(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter value) {
        software.amazon.jsii.Kernel.call(this, "putFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAbortIncompleteMultipartUpload() {
        software.amazon.jsii.Kernel.call(this, "resetAbortIncompleteMultipartUpload", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpiration() {
        software.amazon.jsii.Kernel.call(this, "resetExpiration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilter() {
        software.amazon.jsii.Kernel.call(this, "resetFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadOutputReference getAbortIncompleteMultipartUpload() {
        return software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUpload", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpirationOutputReference getExpiration() {
        return software.amazon.jsii.Kernel.get(this, "expiration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpirationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilterOutputReference getFilter() {
        return software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilterOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload getAbortIncompleteMultipartUploadInput() {
        return software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUploadInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration getExpirationInput() {
        return software.amazon.jsii.Kernel.get(this, "expirationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter getFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "filterInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
