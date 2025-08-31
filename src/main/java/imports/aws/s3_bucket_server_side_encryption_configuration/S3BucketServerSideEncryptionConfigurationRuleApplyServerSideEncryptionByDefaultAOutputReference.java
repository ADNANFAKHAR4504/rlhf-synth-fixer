package imports.aws.s3_bucket_server_side_encryption_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultAOutputReference")
public class S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultAOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultAOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultAOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultAOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
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

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
