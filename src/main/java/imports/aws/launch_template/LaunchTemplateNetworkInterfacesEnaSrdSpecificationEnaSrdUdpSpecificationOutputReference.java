package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecificationOutputReference")
public class LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEnaSrdUdpEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnaSrdUdpEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnaSrdUdpEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdUdpEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnaSrdUdpEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdUdpEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnaSrdUdpEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enaSrdUdpEnabled", java.util.Objects.requireNonNull(value, "enaSrdUdpEnabled is required"));
    }

    public void setEnaSrdUdpEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enaSrdUdpEnabled", java.util.Objects.requireNonNull(value, "enaSrdUdpEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
