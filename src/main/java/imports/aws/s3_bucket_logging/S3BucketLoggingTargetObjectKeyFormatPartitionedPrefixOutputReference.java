package imports.aws.s3_bucket_logging;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLogging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefixOutputReference")
public class S3BucketLoggingTargetObjectKeyFormatPartitionedPrefixOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketLoggingTargetObjectKeyFormatPartitionedPrefixOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketLoggingTargetObjectKeyFormatPartitionedPrefixOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketLoggingTargetObjectKeyFormatPartitionedPrefixOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPartitionDateSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "partitionDateSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPartitionDateSource() {
        return software.amazon.jsii.Kernel.get(this, "partitionDateSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPartitionDateSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "partitionDateSource", java.util.Objects.requireNonNull(value, "partitionDateSource is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
