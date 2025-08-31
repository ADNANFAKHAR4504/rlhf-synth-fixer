package imports.aws.s3_tables_table_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTableBucket.S3TablesTableBucketMaintenanceConfigurationOutputReference")
public class S3TablesTableBucketMaintenanceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3TablesTableBucketMaintenanceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3TablesTableBucketMaintenanceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3TablesTableBucketMaintenanceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIcebergUnreferencedFileRemoval(final @org.jetbrains.annotations.NotNull imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemoval value) {
        software.amazon.jsii.Kernel.call(this, "putIcebergUnreferencedFileRemoval", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetIcebergUnreferencedFileRemoval() {
        software.amazon.jsii.Kernel.call(this, "resetIcebergUnreferencedFileRemoval", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalOutputReference getIcebergUnreferencedFileRemoval() {
        return software.amazon.jsii.Kernel.get(this, "icebergUnreferencedFileRemoval", software.amazon.jsii.NativeType.forClass(imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIcebergUnreferencedFileRemovalInput() {
        return software.amazon.jsii.Kernel.get(this, "icebergUnreferencedFileRemovalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
