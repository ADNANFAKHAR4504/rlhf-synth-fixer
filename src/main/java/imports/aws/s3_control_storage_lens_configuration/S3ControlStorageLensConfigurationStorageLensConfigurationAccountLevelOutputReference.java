package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelOutputReference")
public class S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putActivityMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putActivityMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAdvancedCostOptimizationMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putAdvancedCostOptimizationMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAdvancedDataProtectionMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putAdvancedDataProtectionMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBucketLevel(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel value) {
        software.amazon.jsii.Kernel.call(this, "putBucketLevel", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDetailedStatusCodeMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putDetailedStatusCodeMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActivityMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetActivityMetrics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdvancedCostOptimizationMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetAdvancedCostOptimizationMetrics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdvancedDataProtectionMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetAdvancedDataProtectionMetrics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDetailedStatusCodeMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetDetailedStatusCodeMetrics", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetricsOutputReference getActivityMetrics() {
        return software.amazon.jsii.Kernel.get(this, "activityMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetricsOutputReference getAdvancedCostOptimizationMetrics() {
        return software.amazon.jsii.Kernel.get(this, "advancedCostOptimizationMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetricsOutputReference getAdvancedDataProtectionMetrics() {
        return software.amazon.jsii.Kernel.get(this, "advancedDataProtectionMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelOutputReference getBucketLevel() {
        return software.amazon.jsii.Kernel.get(this, "bucketLevel", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetricsOutputReference getDetailedStatusCodeMetrics() {
        return software.amazon.jsii.Kernel.get(this, "detailedStatusCodeMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics getActivityMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "activityMetricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelActivityMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics getAdvancedCostOptimizationMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedCostOptimizationMetricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedCostOptimizationMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics getAdvancedDataProtectionMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedDataProtectionMetricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelAdvancedDataProtectionMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel getBucketLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketLevelInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics getDetailedStatusCodeMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "detailedStatusCodeMetricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelDetailedStatusCodeMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevel value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
