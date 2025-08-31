package imports.aws.s3_tables_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTable.S3TablesTableMaintenanceConfigurationOutputReference")
public class S3TablesTableMaintenanceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3TablesTableMaintenanceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3TablesTableMaintenanceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3TablesTableMaintenanceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIcebergCompaction(final @org.jetbrains.annotations.NotNull imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompaction value) {
        software.amazon.jsii.Kernel.call(this, "putIcebergCompaction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIcebergSnapshotManagement(final @org.jetbrains.annotations.NotNull imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement value) {
        software.amazon.jsii.Kernel.call(this, "putIcebergSnapshotManagement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetIcebergCompaction() {
        software.amazon.jsii.Kernel.call(this, "resetIcebergCompaction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIcebergSnapshotManagement() {
        software.amazon.jsii.Kernel.call(this, "resetIcebergSnapshotManagement", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompactionOutputReference getIcebergCompaction() {
        return software.amazon.jsii.Kernel.get(this, "icebergCompaction", software.amazon.jsii.NativeType.forClass(imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompactionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementOutputReference getIcebergSnapshotManagement() {
        return software.amazon.jsii.Kernel.get(this, "icebergSnapshotManagement", software.amazon.jsii.NativeType.forClass(imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIcebergCompactionInput() {
        return software.amazon.jsii.Kernel.get(this, "icebergCompactionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIcebergSnapshotManagementInput() {
        return software.amazon.jsii.Kernel.get(this, "icebergSnapshotManagementInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_tables_table.S3TablesTableMaintenanceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
