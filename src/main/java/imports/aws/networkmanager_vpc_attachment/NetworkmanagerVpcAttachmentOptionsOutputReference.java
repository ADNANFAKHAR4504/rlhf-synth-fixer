package imports.aws.networkmanager_vpc_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.978Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerVpcAttachment.NetworkmanagerVpcAttachmentOptionsOutputReference")
public class NetworkmanagerVpcAttachmentOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkmanagerVpcAttachmentOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkmanagerVpcAttachmentOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkmanagerVpcAttachmentOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetApplianceModeSupport() {
        software.amazon.jsii.Kernel.call(this, "resetApplianceModeSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Support() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Support", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplianceModeSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "applianceModeSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIpv6SupportInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6SupportInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getApplianceModeSupport() {
        return software.amazon.jsii.Kernel.get(this, "applianceModeSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setApplianceModeSupport(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "applianceModeSupport", java.util.Objects.requireNonNull(value, "applianceModeSupport is required"));
    }

    public void setApplianceModeSupport(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "applianceModeSupport", java.util.Objects.requireNonNull(value, "applianceModeSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIpv6Support() {
        return software.amazon.jsii.Kernel.get(this, "ipv6Support", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIpv6Support(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Support", java.util.Objects.requireNonNull(value, "ipv6Support is required"));
    }

    public void setIpv6Support(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Support", java.util.Objects.requireNonNull(value, "ipv6Support is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkmanager_vpc_attachment.NetworkmanagerVpcAttachmentOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_vpc_attachment.NetworkmanagerVpcAttachmentOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkmanager_vpc_attachment.NetworkmanagerVpcAttachmentOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
