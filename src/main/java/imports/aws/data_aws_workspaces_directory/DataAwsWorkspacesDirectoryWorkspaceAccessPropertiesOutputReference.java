package imports.aws.data_aws_workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.931Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsWorkspacesDirectory.DataAwsWorkspacesDirectoryWorkspaceAccessPropertiesOutputReference")
public class DataAwsWorkspacesDirectoryWorkspaceAccessPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsWorkspacesDirectoryWorkspaceAccessPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsWorkspacesDirectoryWorkspaceAccessPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsWorkspacesDirectoryWorkspaceAccessPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeAndroid() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeAndroid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeChromeos() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeChromeos", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeIos() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeIos", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeLinux() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeLinux", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeOsx() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeOsx", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeWeb() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeWeb", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeWindows() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeWindows", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTypeZeroclient() {
        return software.amazon.jsii.Kernel.get(this, "deviceTypeZeroclient", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_workspaces_directory.DataAwsWorkspacesDirectoryWorkspaceAccessProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_workspaces_directory.DataAwsWorkspacesDirectoryWorkspaceAccessProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_workspaces_directory.DataAwsWorkspacesDirectoryWorkspaceAccessProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
