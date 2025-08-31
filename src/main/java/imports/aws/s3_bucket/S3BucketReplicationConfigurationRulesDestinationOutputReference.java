package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketReplicationConfigurationRulesDestinationOutputReference")
public class S3BucketReplicationConfigurationRulesDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketReplicationConfigurationRulesDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketReplicationConfigurationRulesDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketReplicationConfigurationRulesDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAccessControlTranslation(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation value) {
        software.amazon.jsii.Kernel.call(this, "putAccessControlTranslation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putReplicationTime(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime value) {
        software.amazon.jsii.Kernel.call(this, "putReplicationTime", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessControlTranslation() {
        software.amazon.jsii.Kernel.call(this, "resetAccessControlTranslation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetMetrics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicaKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetReplicaKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicationTime() {
        software.amazon.jsii.Kernel.call(this, "resetReplicationTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageClass() {
        software.amazon.jsii.Kernel.call(this, "resetStorageClass", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslationOutputReference getAccessControlTranslation() {
        return software.amazon.jsii.Kernel.get(this, "accessControlTranslation", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetricsOutputReference getMetrics() {
        return software.amazon.jsii.Kernel.get(this, "metrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTimeOutputReference getReplicationTime() {
        return software.amazon.jsii.Kernel.get(this, "replicationTime", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTimeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation getAccessControlTranslationInput() {
        return software.amazon.jsii.Kernel.get(this, "accessControlTranslationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics getMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "metricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicaKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "replicaKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime getReplicationTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationTimeInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageClassInput() {
        return software.amazon.jsii.Kernel.get(this, "storageClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucket() {
        return software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucket", java.util.Objects.requireNonNull(value, "bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicaKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "replicaKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicaKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicaKmsKeyId", java.util.Objects.requireNonNull(value, "replicaKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageClass() {
        return software.amazon.jsii.Kernel.get(this, "storageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageClass", java.util.Objects.requireNonNull(value, "storageClass is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
