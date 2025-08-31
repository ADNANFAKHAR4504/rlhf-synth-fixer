package imports.aws.networkmanager_connect_peer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.965Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerConnectPeer.NetworkmanagerConnectPeerBgpOptionsOutputReference")
public class NetworkmanagerConnectPeerBgpOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkmanagerConnectPeerBgpOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkmanagerConnectPeerBgpOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkmanagerConnectPeerBgpOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetPeerAsn() {
        software.amazon.jsii.Kernel.call(this, "resetPeerAsn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPeerAsnInput() {
        return software.amazon.jsii.Kernel.get(this, "peerAsnInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPeerAsn() {
        return software.amazon.jsii.Kernel.get(this, "peerAsn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPeerAsn(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "peerAsn", java.util.Objects.requireNonNull(value, "peerAsn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
