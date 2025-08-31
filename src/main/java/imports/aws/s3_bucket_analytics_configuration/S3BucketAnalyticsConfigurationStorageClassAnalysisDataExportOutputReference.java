package imports.aws.s3_bucket_analytics_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.250Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketAnalyticsConfiguration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportOutputReference")
public class S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDestination(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination value) {
        software.amazon.jsii.Kernel.call(this, "putDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOutputSchemaVersion() {
        software.amazon.jsii.Kernel.call(this, "resetOutputSchemaVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationOutputReference getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination getDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputSchemaVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "outputSchemaVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputSchemaVersion() {
        return software.amazon.jsii.Kernel.get(this, "outputSchemaVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputSchemaVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputSchemaVersion", java.util.Objects.requireNonNull(value, "outputSchemaVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
