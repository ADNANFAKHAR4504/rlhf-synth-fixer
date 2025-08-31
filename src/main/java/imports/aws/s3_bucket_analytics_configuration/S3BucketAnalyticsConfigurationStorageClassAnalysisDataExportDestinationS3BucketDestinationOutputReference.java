package imports.aws.s3_bucket_analytics_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.250Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketAnalyticsConfiguration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestinationOutputReference")
public class S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBucketAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetBucketAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFormat() {
        software.amazon.jsii.Kernel.call(this, "resetFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketArnInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "formatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketAccountId() {
        return software.amazon.jsii.Kernel.get(this, "bucketAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketAccountId", java.util.Objects.requireNonNull(value, "bucketAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketArn() {
        return software.amazon.jsii.Kernel.get(this, "bucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketArn", java.util.Objects.requireNonNull(value, "bucketArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFormat() {
        return software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "format", java.util.Objects.requireNonNull(value, "format is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "prefix", java.util.Objects.requireNonNull(value, "prefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
