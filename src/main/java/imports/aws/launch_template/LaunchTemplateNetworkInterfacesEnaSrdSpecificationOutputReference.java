package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateNetworkInterfacesEnaSrdSpecificationOutputReference")
public class LaunchTemplateNetworkInterfacesEnaSrdSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplateNetworkInterfacesEnaSrdSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplateNetworkInterfacesEnaSrdSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LaunchTemplateNetworkInterfacesEnaSrdSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEnaSrdUdpSpecification(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putEnaSrdUdpSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnaSrdEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnaSrdEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnaSrdUdpSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetEnaSrdUdpSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecificationOutputReference getEnaSrdUdpSpecification() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdUdpSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnaSrdEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification getEnaSrdUdpSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdUdpSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnaSrdEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnaSrdEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enaSrdEnabled", java.util.Objects.requireNonNull(value, "enaSrdEnabled is required"));
    }

    public void setEnaSrdEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enaSrdEnabled", java.util.Objects.requireNonNull(value, "enaSrdEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
