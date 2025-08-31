package imports.aws.s3_bucket_analytics_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.250Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketAnalyticsConfiguration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationOutputReference")
public class S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3BucketDestination(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination value) {
        software.amazon.jsii.Kernel.call(this, "putS3BucketDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestinationOutputReference getS3BucketDestination() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketDestination", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination getS3BucketDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
