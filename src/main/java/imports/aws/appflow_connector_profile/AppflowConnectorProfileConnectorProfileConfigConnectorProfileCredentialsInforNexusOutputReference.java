package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.002Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexusOutputReference")
public class AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexusOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexusOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexusOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexusOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accessKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatakeyInput() {
        return software.amazon.jsii.Kernel.get(this, "datakeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecretAccessKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "secretAccessKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserIdInput() {
        return software.amazon.jsii.Kernel.get(this, "userIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessKeyId() {
        return software.amazon.jsii.Kernel.get(this, "accessKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessKeyId", java.util.Objects.requireNonNull(value, "accessKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatakey() {
        return software.amazon.jsii.Kernel.get(this, "datakey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatakey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "datakey", java.util.Objects.requireNonNull(value, "datakey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecretAccessKey() {
        return software.amazon.jsii.Kernel.get(this, "secretAccessKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecretAccessKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secretAccessKey", java.util.Objects.requireNonNull(value, "secretAccessKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserId() {
        return software.amazon.jsii.Kernel.get(this, "userId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userId", java.util.Objects.requireNonNull(value, "userId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
