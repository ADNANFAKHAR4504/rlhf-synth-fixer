package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointRedisSettingsOutputReference")
public class DmsEndpointRedisSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DmsEndpointRedisSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsEndpointRedisSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DmsEndpointRedisSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuthPassword() {
        software.amazon.jsii.Kernel.call(this, "resetAuthPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthUserName() {
        software.amazon.jsii.Kernel.call(this, "resetAuthUserName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslCaCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetSslCaCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslSecurityProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetSslSecurityProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "authPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "authTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthUserNameInput() {
        return software.amazon.jsii.Kernel.get(this, "authUserNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "serverNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslCaCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sslCaCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslSecurityProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "sslSecurityProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthPassword() {
        return software.amazon.jsii.Kernel.get(this, "authPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authPassword", java.util.Objects.requireNonNull(value, "authPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthType() {
        return software.amazon.jsii.Kernel.get(this, "authType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authType", java.util.Objects.requireNonNull(value, "authType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthUserName() {
        return software.amazon.jsii.Kernel.get(this, "authUserName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthUserName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authUserName", java.util.Objects.requireNonNull(value, "authUserName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerName() {
        return software.amazon.jsii.Kernel.get(this, "serverName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serverName", java.util.Objects.requireNonNull(value, "serverName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslCaCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "sslCaCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslCaCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslCaCertificateArn", java.util.Objects.requireNonNull(value, "sslCaCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslSecurityProtocol() {
        return software.amazon.jsii.Kernel.get(this, "sslSecurityProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslSecurityProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslSecurityProtocol", java.util.Objects.requireNonNull(value, "sslSecurityProtocol is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointRedisSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointRedisSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointRedisSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
