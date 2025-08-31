package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateNetworkInterfacesConnectionTrackingSpecificationOutputReference")
public class LaunchTemplateNetworkInterfacesConnectionTrackingSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplateNetworkInterfacesConnectionTrackingSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplateNetworkInterfacesConnectionTrackingSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LaunchTemplateNetworkInterfacesConnectionTrackingSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetTcpEstablishedTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetTcpEstablishedTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUdpStreamTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetUdpStreamTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUdpTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetUdpTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTcpEstablishedTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "tcpEstablishedTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUdpStreamTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "udpStreamTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUdpTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "udpTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTcpEstablishedTimeout() {
        return software.amazon.jsii.Kernel.get(this, "tcpEstablishedTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTcpEstablishedTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tcpEstablishedTimeout", java.util.Objects.requireNonNull(value, "tcpEstablishedTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUdpStreamTimeout() {
        return software.amazon.jsii.Kernel.get(this, "udpStreamTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUdpStreamTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "udpStreamTimeout", java.util.Objects.requireNonNull(value, "udpStreamTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUdpTimeout() {
        return software.amazon.jsii.Kernel.get(this, "udpTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUdpTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "udpTimeout", java.util.Objects.requireNonNull(value, "udpTimeout is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
