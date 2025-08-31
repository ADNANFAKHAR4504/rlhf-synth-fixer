package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.285Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelOutputReference")
public class S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putActivityMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putActivityMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAdvancedCostOptimizationMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putAdvancedCostOptimizationMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAdvancedDataProtectionMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putAdvancedDataProtectionMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDetailedStatusCodeMetrics(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics value) {
        software.amazon.jsii.Kernel.call(this, "putDetailedStatusCodeMetrics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrefixLevel(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel value) {
        software.amazon.jsii.Kernel.call(this, "putPrefixLevel", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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

    public void resetPrefixLevel() {
        software.amazon.jsii.Kernel.call(this, "resetPrefixLevel", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetricsOutputReference getActivityMetrics() {
        return software.amazon.jsii.Kernel.get(this, "activityMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetricsOutputReference getAdvancedCostOptimizationMetrics() {
        return software.amazon.jsii.Kernel.get(this, "advancedCostOptimizationMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetricsOutputReference getAdvancedDataProtectionMetrics() {
        return software.amazon.jsii.Kernel.get(this, "advancedDataProtectionMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetricsOutputReference getDetailedStatusCodeMetrics() {
        return software.amazon.jsii.Kernel.get(this, "detailedStatusCodeMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetricsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelOutputReference getPrefixLevel() {
        return software.amazon.jsii.Kernel.get(this, "prefixLevel", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics getActivityMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "activityMetricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics getAdvancedCostOptimizationMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedCostOptimizationMetricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics getAdvancedDataProtectionMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedDataProtectionMetricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics getDetailedStatusCodeMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "detailedStatusCodeMetricsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel getPrefixLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixLevelInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
