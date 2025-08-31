package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultOutputReference")
public class S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetKmsMasterKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsMasterKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsMasterKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsMasterKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSseAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "sseAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsMasterKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsMasterKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsMasterKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsMasterKeyId", java.util.Objects.requireNonNull(value, "kmsMasterKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSseAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "sseAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSseAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sseAlgorithm", java.util.Objects.requireNonNull(value, "sseAlgorithm is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
