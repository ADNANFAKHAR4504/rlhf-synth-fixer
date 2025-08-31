package imports.aws.db_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.971Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dbInstance.DbInstanceRestoreToPointInTimeOutputReference")
public class DbInstanceRestoreToPointInTimeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DbInstanceRestoreToPointInTimeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DbInstanceRestoreToPointInTimeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DbInstanceRestoreToPointInTimeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRestoreTime() {
        software.amazon.jsii.Kernel.call(this, "resetRestoreTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceDbInstanceAutomatedBackupsArn() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDbInstanceAutomatedBackupsArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceDbInstanceIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDbInstanceIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceDbiResourceId() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDbiResourceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseLatestRestorableTime() {
        software.amazon.jsii.Kernel.call(this, "resetUseLatestRestorableTime", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRestoreTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "restoreTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceDbInstanceAutomatedBackupsArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDbInstanceAutomatedBackupsArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceDbInstanceIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDbInstanceIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceDbiResourceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDbiResourceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseLatestRestorableTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "useLatestRestorableTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRestoreTime() {
        return software.amazon.jsii.Kernel.get(this, "restoreTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRestoreTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "restoreTime", java.util.Objects.requireNonNull(value, "restoreTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceDbInstanceAutomatedBackupsArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceDbInstanceAutomatedBackupsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceDbInstanceAutomatedBackupsArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceDbInstanceAutomatedBackupsArn", java.util.Objects.requireNonNull(value, "sourceDbInstanceAutomatedBackupsArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceDbInstanceIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "sourceDbInstanceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceDbInstanceIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceDbInstanceIdentifier", java.util.Objects.requireNonNull(value, "sourceDbInstanceIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceDbiResourceId() {
        return software.amazon.jsii.Kernel.get(this, "sourceDbiResourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceDbiResourceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceDbiResourceId", java.util.Objects.requireNonNull(value, "sourceDbiResourceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseLatestRestorableTime() {
        return software.amazon.jsii.Kernel.get(this, "useLatestRestorableTime", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseLatestRestorableTime(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useLatestRestorableTime", java.util.Objects.requireNonNull(value, "useLatestRestorableTime is required"));
    }

    public void setUseLatestRestorableTime(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useLatestRestorableTime", java.util.Objects.requireNonNull(value, "useLatestRestorableTime is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.db_instance.DbInstanceRestoreToPointInTime getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.db_instance.DbInstanceRestoreToPointInTime.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.db_instance.DbInstanceRestoreToPointInTime value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
