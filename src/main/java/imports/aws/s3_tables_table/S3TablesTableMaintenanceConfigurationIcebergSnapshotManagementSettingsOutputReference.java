package imports.aws.s3_tables_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference")
public class S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaxSnapshotAgeHours() {
        software.amazon.jsii.Kernel.call(this, "resetMaxSnapshotAgeHours", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinSnapshotsToKeep() {
        software.amazon.jsii.Kernel.call(this, "resetMinSnapshotsToKeep", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxSnapshotAgeHoursInput() {
        return software.amazon.jsii.Kernel.get(this, "maxSnapshotAgeHoursInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinSnapshotsToKeepInput() {
        return software.amazon.jsii.Kernel.get(this, "minSnapshotsToKeepInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxSnapshotAgeHours() {
        return software.amazon.jsii.Kernel.get(this, "maxSnapshotAgeHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxSnapshotAgeHours(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxSnapshotAgeHours", java.util.Objects.requireNonNull(value, "maxSnapshotAgeHours is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinSnapshotsToKeep() {
        return software.amazon.jsii.Kernel.get(this, "minSnapshotsToKeep", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinSnapshotsToKeep(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minSnapshotsToKeep", java.util.Objects.requireNonNull(value, "minSnapshotsToKeep is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
