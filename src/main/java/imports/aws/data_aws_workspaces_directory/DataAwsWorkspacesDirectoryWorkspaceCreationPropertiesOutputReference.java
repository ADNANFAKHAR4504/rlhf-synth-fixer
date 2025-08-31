package imports.aws.data_aws_workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.931Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsWorkspacesDirectory.DataAwsWorkspacesDirectoryWorkspaceCreationPropertiesOutputReference")
public class DataAwsWorkspacesDirectoryWorkspaceCreationPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsWorkspacesDirectoryWorkspaceCreationPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsWorkspacesDirectoryWorkspaceCreationPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsWorkspacesDirectoryWorkspaceCreationPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomSecurityGroupId() {
        return software.amazon.jsii.Kernel.get(this, "customSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultOu() {
        return software.amazon.jsii.Kernel.get(this, "defaultOu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEnableInternetAccess() {
        return software.amazon.jsii.Kernel.get(this, "enableInternetAccess", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEnableMaintenanceMode() {
        return software.amazon.jsii.Kernel.get(this, "enableMaintenanceMode", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getUserEnabledAsLocalAdministrator() {
        return software.amazon.jsii.Kernel.get(this, "userEnabledAsLocalAdministrator", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_workspaces_directory.DataAwsWorkspacesDirectoryWorkspaceCreationProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_workspaces_directory.DataAwsWorkspacesDirectoryWorkspaceCreationProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_workspaces_directory.DataAwsWorkspacesDirectoryWorkspaceCreationProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
