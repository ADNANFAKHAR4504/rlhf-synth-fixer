package imports.aws.opsworks_stack;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.039Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksStack.OpsworksStackCustomCookbooksSourceOutputReference")
public class OpsworksStackCustomCookbooksSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpsworksStackCustomCookbooksSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksStackCustomCookbooksSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpsworksStackCustomCookbooksSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetPassword() {
        software.amazon.jsii.Kernel.call(this, "resetPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRevision() {
        software.amazon.jsii.Kernel.call(this, "resetRevision", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSshKey() {
        software.amazon.jsii.Kernel.call(this, "resetSshKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUsername() {
        software.amazon.jsii.Kernel.call(this, "resetUsername", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "passwordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRevisionInput() {
        return software.amazon.jsii.Kernel.get(this, "revisionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSshKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "sshKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "urlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "usernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPassword() {
        return software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "password", java.util.Objects.requireNonNull(value, "password is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRevision() {
        return software.amazon.jsii.Kernel.get(this, "revision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRevision(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "revision", java.util.Objects.requireNonNull(value, "revision is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSshKey() {
        return software.amazon.jsii.Kernel.get(this, "sshKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSshKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sshKey", java.util.Objects.requireNonNull(value, "sshKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUrl() {
        return software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "url", java.util.Objects.requireNonNull(value, "url is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsername() {
        return software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "username", java.util.Objects.requireNonNull(value, "username is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
