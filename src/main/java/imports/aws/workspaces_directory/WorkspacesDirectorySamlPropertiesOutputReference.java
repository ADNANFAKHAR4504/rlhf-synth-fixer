package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.687Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectorySamlPropertiesOutputReference")
public class WorkspacesDirectorySamlPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspacesDirectorySamlPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspacesDirectorySamlPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public WorkspacesDirectorySamlPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRelayStateParameterName() {
        software.amazon.jsii.Kernel.call(this, "resetRelayStateParameterName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserAccessUrl() {
        software.amazon.jsii.Kernel.call(this, "resetUserAccessUrl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRelayStateParameterNameInput() {
        return software.amazon.jsii.Kernel.get(this, "relayStateParameterNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserAccessUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "userAccessUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRelayStateParameterName() {
        return software.amazon.jsii.Kernel.get(this, "relayStateParameterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRelayStateParameterName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "relayStateParameterName", java.util.Objects.requireNonNull(value, "relayStateParameterName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserAccessUrl() {
        return software.amazon.jsii.Kernel.get(this, "userAccessUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserAccessUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userAccessUrl", java.util.Objects.requireNonNull(value, "userAccessUrl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
