package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.687Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference")
public class WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCustomSecurityGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetCustomSecurityGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultOu() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultOu", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableInternetAccess() {
        software.amazon.jsii.Kernel.call(this, "resetEnableInternetAccess", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableMaintenanceMode() {
        software.amazon.jsii.Kernel.call(this, "resetEnableMaintenanceMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserEnabledAsLocalAdministrator() {
        software.amazon.jsii.Kernel.call(this, "resetUserEnabledAsLocalAdministrator", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomSecurityGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "customSecurityGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultOuInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultOuInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableInternetAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "enableInternetAccessInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableMaintenanceModeInput() {
        return software.amazon.jsii.Kernel.get(this, "enableMaintenanceModeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserEnabledAsLocalAdministratorInput() {
        return software.amazon.jsii.Kernel.get(this, "userEnabledAsLocalAdministratorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomSecurityGroupId() {
        return software.amazon.jsii.Kernel.get(this, "customSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomSecurityGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customSecurityGroupId", java.util.Objects.requireNonNull(value, "customSecurityGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultOu() {
        return software.amazon.jsii.Kernel.get(this, "defaultOu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultOu(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultOu", java.util.Objects.requireNonNull(value, "defaultOu is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableInternetAccess() {
        return software.amazon.jsii.Kernel.get(this, "enableInternetAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableInternetAccess(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableInternetAccess", java.util.Objects.requireNonNull(value, "enableInternetAccess is required"));
    }

    public void setEnableInternetAccess(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableInternetAccess", java.util.Objects.requireNonNull(value, "enableInternetAccess is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableMaintenanceMode() {
        return software.amazon.jsii.Kernel.get(this, "enableMaintenanceMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableMaintenanceMode(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableMaintenanceMode", java.util.Objects.requireNonNull(value, "enableMaintenanceMode is required"));
    }

    public void setEnableMaintenanceMode(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableMaintenanceMode", java.util.Objects.requireNonNull(value, "enableMaintenanceMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUserEnabledAsLocalAdministrator() {
        return software.amazon.jsii.Kernel.get(this, "userEnabledAsLocalAdministrator", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUserEnabledAsLocalAdministrator(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "userEnabledAsLocalAdministrator", java.util.Objects.requireNonNull(value, "userEnabledAsLocalAdministrator is required"));
    }

    public void setUserEnabledAsLocalAdministrator(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "userEnabledAsLocalAdministrator", java.util.Objects.requireNonNull(value, "userEnabledAsLocalAdministrator is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
