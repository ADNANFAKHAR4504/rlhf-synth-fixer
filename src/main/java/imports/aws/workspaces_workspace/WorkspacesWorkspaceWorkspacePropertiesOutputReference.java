package imports.aws.workspaces_workspace;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.688Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesWorkspace.WorkspacesWorkspaceWorkspacePropertiesOutputReference")
public class WorkspacesWorkspaceWorkspacePropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspacesWorkspaceWorkspacePropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspacesWorkspaceWorkspacePropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public WorkspacesWorkspaceWorkspacePropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetComputeTypeName() {
        software.amazon.jsii.Kernel.call(this, "resetComputeTypeName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootVolumeSizeGib() {
        software.amazon.jsii.Kernel.call(this, "resetRootVolumeSizeGib", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRunningMode() {
        software.amazon.jsii.Kernel.call(this, "resetRunningMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRunningModeAutoStopTimeoutInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetRunningModeAutoStopTimeoutInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserVolumeSizeGib() {
        software.amazon.jsii.Kernel.call(this, "resetUserVolumeSizeGib", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComputeTypeNameInput() {
        return software.amazon.jsii.Kernel.get(this, "computeTypeNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRootVolumeSizeGibInput() {
        return software.amazon.jsii.Kernel.get(this, "rootVolumeSizeGibInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRunningModeAutoStopTimeoutInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "runningModeAutoStopTimeoutInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRunningModeInput() {
        return software.amazon.jsii.Kernel.get(this, "runningModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUserVolumeSizeGibInput() {
        return software.amazon.jsii.Kernel.get(this, "userVolumeSizeGibInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComputeTypeName() {
        return software.amazon.jsii.Kernel.get(this, "computeTypeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComputeTypeName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "computeTypeName", java.util.Objects.requireNonNull(value, "computeTypeName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRootVolumeSizeGib() {
        return software.amazon.jsii.Kernel.get(this, "rootVolumeSizeGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRootVolumeSizeGib(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "rootVolumeSizeGib", java.util.Objects.requireNonNull(value, "rootVolumeSizeGib is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRunningMode() {
        return software.amazon.jsii.Kernel.get(this, "runningMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRunningMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "runningMode", java.util.Objects.requireNonNull(value, "runningMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRunningModeAutoStopTimeoutInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "runningModeAutoStopTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRunningModeAutoStopTimeoutInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "runningModeAutoStopTimeoutInMinutes", java.util.Objects.requireNonNull(value, "runningModeAutoStopTimeoutInMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUserVolumeSizeGib() {
        return software.amazon.jsii.Kernel.get(this, "userVolumeSizeGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUserVolumeSizeGib(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "userVolumeSizeGib", java.util.Objects.requireNonNull(value, "userVolumeSizeGib is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
