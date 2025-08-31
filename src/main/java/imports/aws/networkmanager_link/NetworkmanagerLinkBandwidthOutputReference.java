package imports.aws.networkmanager_link;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.972Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerLink.NetworkmanagerLinkBandwidthOutputReference")
public class NetworkmanagerLinkBandwidthOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkmanagerLinkBandwidthOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkmanagerLinkBandwidthOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkmanagerLinkBandwidthOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDownloadSpeed() {
        software.amazon.jsii.Kernel.call(this, "resetDownloadSpeed", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUploadSpeed() {
        software.amazon.jsii.Kernel.call(this, "resetUploadSpeed", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDownloadSpeedInput() {
        return software.amazon.jsii.Kernel.get(this, "downloadSpeedInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUploadSpeedInput() {
        return software.amazon.jsii.Kernel.get(this, "uploadSpeedInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDownloadSpeed() {
        return software.amazon.jsii.Kernel.get(this, "downloadSpeed", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDownloadSpeed(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "downloadSpeed", java.util.Objects.requireNonNull(value, "downloadSpeed is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUploadSpeed() {
        return software.amazon.jsii.Kernel.get(this, "uploadSpeed", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUploadSpeed(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "uploadSpeed", java.util.Objects.requireNonNull(value, "uploadSpeed is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkmanager_link.NetworkmanagerLinkBandwidth getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_link.NetworkmanagerLinkBandwidth.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkmanager_link.NetworkmanagerLinkBandwidth value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
