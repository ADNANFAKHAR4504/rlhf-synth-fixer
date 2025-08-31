package imports.aws.s3_tables_table_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTableBucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettingsOutputReference")
public class S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetNonCurrentDays() {
        software.amazon.jsii.Kernel.call(this, "resetNonCurrentDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnreferencedDays() {
        software.amazon.jsii.Kernel.call(this, "resetUnreferencedDays", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNonCurrentDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "nonCurrentDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUnreferencedDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "unreferencedDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNonCurrentDays() {
        return software.amazon.jsii.Kernel.get(this, "nonCurrentDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNonCurrentDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "nonCurrentDays", java.util.Objects.requireNonNull(value, "nonCurrentDays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUnreferencedDays() {
        return software.amazon.jsii.Kernel.get(this, "unreferencedDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUnreferencedDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "unreferencedDays", java.util.Objects.requireNonNull(value, "unreferencedDays is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
