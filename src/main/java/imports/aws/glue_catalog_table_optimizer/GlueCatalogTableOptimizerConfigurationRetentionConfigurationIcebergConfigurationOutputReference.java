package imports.aws.glue_catalog_table_optimizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference")
public class GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetCleanExpiredFiles() {
        software.amazon.jsii.Kernel.call(this, "resetCleanExpiredFiles", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumberOfSnapshotsToRetain() {
        software.amazon.jsii.Kernel.call(this, "resetNumberOfSnapshotsToRetain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotRetentionPeriodInDays() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotRetentionPeriodInDays", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCleanExpiredFilesInput() {
        return software.amazon.jsii.Kernel.get(this, "cleanExpiredFilesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfSnapshotsToRetainInput() {
        return software.amazon.jsii.Kernel.get(this, "numberOfSnapshotsToRetainInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSnapshotRetentionPeriodInDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotRetentionPeriodInDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCleanExpiredFiles() {
        return software.amazon.jsii.Kernel.get(this, "cleanExpiredFiles", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCleanExpiredFiles(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cleanExpiredFiles", java.util.Objects.requireNonNull(value, "cleanExpiredFiles is required"));
    }

    public void setCleanExpiredFiles(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cleanExpiredFiles", java.util.Objects.requireNonNull(value, "cleanExpiredFiles is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfSnapshotsToRetain() {
        return software.amazon.jsii.Kernel.get(this, "numberOfSnapshotsToRetain", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumberOfSnapshotsToRetain(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numberOfSnapshotsToRetain", java.util.Objects.requireNonNull(value, "numberOfSnapshotsToRetain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSnapshotRetentionPeriodInDays() {
        return software.amazon.jsii.Kernel.get(this, "snapshotRetentionPeriodInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSnapshotRetentionPeriodInDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "snapshotRetentionPeriodInDays", java.util.Objects.requireNonNull(value, "snapshotRetentionPeriodInDays is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
