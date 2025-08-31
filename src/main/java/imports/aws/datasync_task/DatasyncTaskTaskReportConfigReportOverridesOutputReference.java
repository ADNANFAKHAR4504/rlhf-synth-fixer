package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskTaskReportConfigReportOverridesOutputReference")
public class DatasyncTaskTaskReportConfigReportOverridesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncTaskTaskReportConfigReportOverridesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncTaskTaskReportConfigReportOverridesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncTaskTaskReportConfigReportOverridesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDeletedOverride() {
        software.amazon.jsii.Kernel.call(this, "resetDeletedOverride", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkippedOverride() {
        software.amazon.jsii.Kernel.call(this, "resetSkippedOverride", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransferredOverride() {
        software.amazon.jsii.Kernel.call(this, "resetTransferredOverride", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerifiedOverride() {
        software.amazon.jsii.Kernel.call(this, "resetVerifiedOverride", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeletedOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "deletedOverrideInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSkippedOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "skippedOverrideInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransferredOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "transferredOverrideInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVerifiedOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "verifiedOverrideInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeletedOverride() {
        return software.amazon.jsii.Kernel.get(this, "deletedOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeletedOverride(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deletedOverride", java.util.Objects.requireNonNull(value, "deletedOverride is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSkippedOverride() {
        return software.amazon.jsii.Kernel.get(this, "skippedOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSkippedOverride(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "skippedOverride", java.util.Objects.requireNonNull(value, "skippedOverride is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransferredOverride() {
        return software.amazon.jsii.Kernel.get(this, "transferredOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransferredOverride(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transferredOverride", java.util.Objects.requireNonNull(value, "transferredOverride is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVerifiedOverride() {
        return software.amazon.jsii.Kernel.get(this, "verifiedOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVerifiedOverride(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "verifiedOverride", java.util.Objects.requireNonNull(value, "verifiedOverride is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
