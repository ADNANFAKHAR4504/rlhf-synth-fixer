package imports.aws.s3_bucket_logging;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLogging.S3BucketLoggingTargetObjectKeyFormatOutputReference")
public class S3BucketLoggingTargetObjectKeyFormatOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketLoggingTargetObjectKeyFormatOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketLoggingTargetObjectKeyFormatOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketLoggingTargetObjectKeyFormatOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPartitionedPrefix(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix value) {
        software.amazon.jsii.Kernel.call(this, "putPartitionedPrefix", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSimplePrefix(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix value) {
        software.amazon.jsii.Kernel.call(this, "putSimplePrefix", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPartitionedPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetPartitionedPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSimplePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetSimplePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefixOutputReference getPartitionedPrefix() {
        return software.amazon.jsii.Kernel.get(this, "partitionedPrefix", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefixOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefixOutputReference getSimplePrefix() {
        return software.amazon.jsii.Kernel.get(this, "simplePrefix", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefixOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix getPartitionedPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "partitionedPrefixInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix getSimplePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "simplePrefixInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormat getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormat.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormat value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
