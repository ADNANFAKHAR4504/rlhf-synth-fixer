package imports.aws.vpn_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.632Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpnConnection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptionsOutputReference")
public class VpnConnectionTunnel2LogOptionsCloudwatchLogOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpnConnectionTunnel2LogOptionsCloudwatchLogOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpnConnectionTunnel2LogOptionsCloudwatchLogOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpnConnectionTunnel2LogOptionsCloudwatchLogOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLogEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetLogEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetLogGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogOutputFormat() {
        software.amazon.jsii.Kernel.call(this, "resetLogOutputFormat", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "logEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "logGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogOutputFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "logOutputFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getLogEnabled() {
        return software.amazon.jsii.Kernel.get(this, "logEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setLogEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "logEnabled", java.util.Objects.requireNonNull(value, "logEnabled is required"));
    }

    public void setLogEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "logEnabled", java.util.Objects.requireNonNull(value, "logEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "logGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logGroupArn", java.util.Objects.requireNonNull(value, "logGroupArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogOutputFormat() {
        return software.amazon.jsii.Kernel.get(this, "logOutputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogOutputFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logOutputFormat", java.util.Objects.requireNonNull(value, "logOutputFormat is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
