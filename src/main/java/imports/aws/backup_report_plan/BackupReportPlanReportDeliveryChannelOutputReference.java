package imports.aws.backup_report_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.119Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupReportPlan.BackupReportPlanReportDeliveryChannelOutputReference")
public class BackupReportPlanReportDeliveryChannelOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BackupReportPlanReportDeliveryChannelOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BackupReportPlanReportDeliveryChannelOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BackupReportPlanReportDeliveryChannelOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFormats() {
        software.amazon.jsii.Kernel.call(this, "resetFormats", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3KeyPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetS3KeyPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFormatsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "formatsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getFormats() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "formats", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setFormats(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "formats", java.util.Objects.requireNonNull(value, "formats is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3BucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3BucketName", java.util.Objects.requireNonNull(value, "s3BucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3KeyPrefix() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3KeyPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3KeyPrefix", java.util.Objects.requireNonNull(value, "s3KeyPrefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.backup_report_plan.BackupReportPlanReportDeliveryChannel getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.backup_report_plan.BackupReportPlanReportDeliveryChannel.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.backup_report_plan.BackupReportPlanReportDeliveryChannel value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
