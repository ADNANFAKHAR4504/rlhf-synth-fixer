package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.687Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectorySelfServicePermissionsOutputReference")
public class WorkspacesDirectorySelfServicePermissionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspacesDirectorySelfServicePermissionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspacesDirectorySelfServicePermissionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public WorkspacesDirectorySelfServicePermissionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetChangeComputeType() {
        software.amazon.jsii.Kernel.call(this, "resetChangeComputeType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncreaseVolumeSize() {
        software.amazon.jsii.Kernel.call(this, "resetIncreaseVolumeSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRebuildWorkspace() {
        software.amazon.jsii.Kernel.call(this, "resetRebuildWorkspace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestartWorkspace() {
        software.amazon.jsii.Kernel.call(this, "resetRestartWorkspace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSwitchRunningMode() {
        software.amazon.jsii.Kernel.call(this, "resetSwitchRunningMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getChangeComputeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "changeComputeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncreaseVolumeSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "increaseVolumeSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRebuildWorkspaceInput() {
        return software.amazon.jsii.Kernel.get(this, "rebuildWorkspaceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRestartWorkspaceInput() {
        return software.amazon.jsii.Kernel.get(this, "restartWorkspaceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSwitchRunningModeInput() {
        return software.amazon.jsii.Kernel.get(this, "switchRunningModeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getChangeComputeType() {
        return software.amazon.jsii.Kernel.get(this, "changeComputeType", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setChangeComputeType(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "changeComputeType", java.util.Objects.requireNonNull(value, "changeComputeType is required"));
    }

    public void setChangeComputeType(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "changeComputeType", java.util.Objects.requireNonNull(value, "changeComputeType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncreaseVolumeSize() {
        return software.amazon.jsii.Kernel.get(this, "increaseVolumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncreaseVolumeSize(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "increaseVolumeSize", java.util.Objects.requireNonNull(value, "increaseVolumeSize is required"));
    }

    public void setIncreaseVolumeSize(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "increaseVolumeSize", java.util.Objects.requireNonNull(value, "increaseVolumeSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRebuildWorkspace() {
        return software.amazon.jsii.Kernel.get(this, "rebuildWorkspace", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRebuildWorkspace(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "rebuildWorkspace", java.util.Objects.requireNonNull(value, "rebuildWorkspace is required"));
    }

    public void setRebuildWorkspace(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "rebuildWorkspace", java.util.Objects.requireNonNull(value, "rebuildWorkspace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRestartWorkspace() {
        return software.amazon.jsii.Kernel.get(this, "restartWorkspace", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRestartWorkspace(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "restartWorkspace", java.util.Objects.requireNonNull(value, "restartWorkspace is required"));
    }

    public void setRestartWorkspace(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "restartWorkspace", java.util.Objects.requireNonNull(value, "restartWorkspace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSwitchRunningMode() {
        return software.amazon.jsii.Kernel.get(this, "switchRunningMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSwitchRunningMode(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "switchRunningMode", java.util.Objects.requireNonNull(value, "switchRunningMode is required"));
    }

    public void setSwitchRunningMode(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "switchRunningMode", java.util.Objects.requireNonNull(value, "switchRunningMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
