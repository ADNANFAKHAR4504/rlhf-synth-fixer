package imports.aws.imagebuilder_infrastructure_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationPlacementOutputReference")
public class ImagebuilderInfrastructureConfigurationPlacementOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderInfrastructureConfigurationPlacementOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderInfrastructureConfigurationPlacementOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderInfrastructureConfigurationPlacementOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostId() {
        software.amazon.jsii.Kernel.call(this, "resetHostId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostResourceGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetHostResourceGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTenancy() {
        software.amazon.jsii.Kernel.call(this, "resetTenancy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostIdInput() {
        return software.amazon.jsii.Kernel.get(this, "hostIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostResourceGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "hostResourceGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTenancyInput() {
        return software.amazon.jsii.Kernel.get(this, "tenancyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostId() {
        return software.amazon.jsii.Kernel.get(this, "hostId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostId", java.util.Objects.requireNonNull(value, "hostId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostResourceGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "hostResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostResourceGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostResourceGroupArn", java.util.Objects.requireNonNull(value, "hostResourceGroupArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTenancy() {
        return software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTenancy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tenancy", java.util.Objects.requireNonNull(value, "tenancy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacement getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacement.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacement value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
