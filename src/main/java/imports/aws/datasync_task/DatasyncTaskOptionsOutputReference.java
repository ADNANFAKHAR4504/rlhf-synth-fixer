package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskOptionsOutputReference")
public class DatasyncTaskOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncTaskOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncTaskOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncTaskOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAtime() {
        software.amazon.jsii.Kernel.call(this, "resetAtime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBytesPerSecond() {
        software.amazon.jsii.Kernel.call(this, "resetBytesPerSecond", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGid() {
        software.amazon.jsii.Kernel.call(this, "resetGid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLogLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMtime() {
        software.amazon.jsii.Kernel.call(this, "resetMtime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetObjectTags() {
        software.amazon.jsii.Kernel.call(this, "resetObjectTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverwriteMode() {
        software.amazon.jsii.Kernel.call(this, "resetOverwriteMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPosixPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetPosixPermissions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreserveDeletedFiles() {
        software.amazon.jsii.Kernel.call(this, "resetPreserveDeletedFiles", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreserveDevices() {
        software.amazon.jsii.Kernel.call(this, "resetPreserveDevices", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityDescriptorCopyFlags() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityDescriptorCopyFlags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskQueueing() {
        software.amazon.jsii.Kernel.call(this, "resetTaskQueueing", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransferMode() {
        software.amazon.jsii.Kernel.call(this, "resetTransferMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUid() {
        software.amazon.jsii.Kernel.call(this, "resetUid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerifyMode() {
        software.amazon.jsii.Kernel.call(this, "resetVerifyMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAtimeInput() {
        return software.amazon.jsii.Kernel.get(this, "atimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBytesPerSecondInput() {
        return software.amazon.jsii.Kernel.get(this, "bytesPerSecondInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGidInput() {
        return software.amazon.jsii.Kernel.get(this, "gidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "logLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMtimeInput() {
        return software.amazon.jsii.Kernel.get(this, "mtimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "objectTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOverwriteModeInput() {
        return software.amazon.jsii.Kernel.get(this, "overwriteModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPosixPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "posixPermissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreserveDeletedFilesInput() {
        return software.amazon.jsii.Kernel.get(this, "preserveDeletedFilesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreserveDevicesInput() {
        return software.amazon.jsii.Kernel.get(this, "preserveDevicesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityDescriptorCopyFlagsInput() {
        return software.amazon.jsii.Kernel.get(this, "securityDescriptorCopyFlagsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskQueueingInput() {
        return software.amazon.jsii.Kernel.get(this, "taskQueueingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransferModeInput() {
        return software.amazon.jsii.Kernel.get(this, "transferModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUidInput() {
        return software.amazon.jsii.Kernel.get(this, "uidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVerifyModeInput() {
        return software.amazon.jsii.Kernel.get(this, "verifyModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAtime() {
        return software.amazon.jsii.Kernel.get(this, "atime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAtime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "atime", java.util.Objects.requireNonNull(value, "atime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBytesPerSecond() {
        return software.amazon.jsii.Kernel.get(this, "bytesPerSecond", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBytesPerSecond(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bytesPerSecond", java.util.Objects.requireNonNull(value, "bytesPerSecond is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGid() {
        return software.amazon.jsii.Kernel.get(this, "gid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gid", java.util.Objects.requireNonNull(value, "gid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogLevel() {
        return software.amazon.jsii.Kernel.get(this, "logLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logLevel", java.util.Objects.requireNonNull(value, "logLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMtime() {
        return software.amazon.jsii.Kernel.get(this, "mtime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMtime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mtime", java.util.Objects.requireNonNull(value, "mtime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectTags() {
        return software.amazon.jsii.Kernel.get(this, "objectTags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectTags(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectTags", java.util.Objects.requireNonNull(value, "objectTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOverwriteMode() {
        return software.amazon.jsii.Kernel.get(this, "overwriteMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOverwriteMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "overwriteMode", java.util.Objects.requireNonNull(value, "overwriteMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPosixPermissions() {
        return software.amazon.jsii.Kernel.get(this, "posixPermissions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPosixPermissions(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "posixPermissions", java.util.Objects.requireNonNull(value, "posixPermissions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreserveDeletedFiles() {
        return software.amazon.jsii.Kernel.get(this, "preserveDeletedFiles", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreserveDeletedFiles(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preserveDeletedFiles", java.util.Objects.requireNonNull(value, "preserveDeletedFiles is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreserveDevices() {
        return software.amazon.jsii.Kernel.get(this, "preserveDevices", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreserveDevices(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preserveDevices", java.util.Objects.requireNonNull(value, "preserveDevices is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityDescriptorCopyFlags() {
        return software.amazon.jsii.Kernel.get(this, "securityDescriptorCopyFlags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityDescriptorCopyFlags(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityDescriptorCopyFlags", java.util.Objects.requireNonNull(value, "securityDescriptorCopyFlags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskQueueing() {
        return software.amazon.jsii.Kernel.get(this, "taskQueueing", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskQueueing(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskQueueing", java.util.Objects.requireNonNull(value, "taskQueueing is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransferMode() {
        return software.amazon.jsii.Kernel.get(this, "transferMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransferMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transferMode", java.util.Objects.requireNonNull(value, "transferMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUid() {
        return software.amazon.jsii.Kernel.get(this, "uid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "uid", java.util.Objects.requireNonNull(value, "uid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVerifyMode() {
        return software.amazon.jsii.Kernel.get(this, "verifyMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVerifyMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "verifyMode", java.util.Objects.requireNonNull(value, "verifyMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
