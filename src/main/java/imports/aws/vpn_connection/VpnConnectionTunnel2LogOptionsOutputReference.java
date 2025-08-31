package imports.aws.vpn_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.632Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpnConnection.VpnConnectionTunnel2LogOptionsOutputReference")
public class VpnConnectionTunnel2LogOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpnConnectionTunnel2LogOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpnConnectionTunnel2LogOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpnConnectionTunnel2LogOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogOptions(final @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogOptions() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogOptions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptionsOutputReference getCloudwatchLogOptions() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogOptions", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptions getCloudwatchLogOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsCloudwatchLogOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
