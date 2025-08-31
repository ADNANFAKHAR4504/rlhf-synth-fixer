package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.687Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference")
public class WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDeviceTypeAndroid() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTypeAndroid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceTypeChromeos() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTypeChromeos", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceTypeIos() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTypeIos", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceTypeLinux() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTypeLinux", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceTypeOsx() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTypeOsx", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceTypeWeb() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTypeWeb", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceTypeWindows() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTypeWindows", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceTypeZeroclient() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTypeZeroclient", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeAndroidInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeAndroidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeChromeosInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeChromeosInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeIosInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeIosInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeLinuxInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeLinuxInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeOsxInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeOsxInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeWebInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeWebInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeWindowsInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeWindowsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeZeroclientInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeZeroclientInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeAndroid() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeAndroid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTypeAndroid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTypeAndroid", java.util.Objects.requireNonNull(value, "deviceTypeAndroid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeChromeos() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeChromeos", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTypeChromeos(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTypeChromeos", java.util.Objects.requireNonNull(value, "deviceTypeChromeos is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeIos() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeIos", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTypeIos(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTypeIos", java.util.Objects.requireNonNull(value, "deviceTypeIos is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeLinux() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeLinux", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTypeLinux(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTypeLinux", java.util.Objects.requireNonNull(value, "deviceTypeLinux is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeOsx() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeOsx", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTypeOsx(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTypeOsx", java.util.Objects.requireNonNull(value, "deviceTypeOsx is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeWeb() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeWeb", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTypeWeb(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTypeWeb", java.util.Objects.requireNonNull(value, "deviceTypeWeb is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeWindows() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeWindows", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTypeWindows(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTypeWindows", java.util.Objects.requireNonNull(value, "deviceTypeWindows is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeZeroclient() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeZeroclient", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTypeZeroclient(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTypeZeroclient", java.util.Objects.requireNonNull(value, "deviceTypeZeroclient is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
