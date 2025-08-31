package imports.aws.data_aws_launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.731Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLaunchTemplate.DataAwsLaunchTemplateNetworkInterfacesOutputReference")
public class DataAwsLaunchTemplateNetworkInterfacesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsLaunchTemplateNetworkInterfacesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsLaunchTemplateNetworkInterfacesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsLaunchTemplateNetworkInterfacesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociateCarrierIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "associateCarrierIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociatePublicIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "associatePublicIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_launch_template.DataAwsLaunchTemplateNetworkInterfacesConnectionTrackingSpecificationList getConnectionTrackingSpecification() {
        return software.amazon.jsii.Kernel.get(this, "connectionTrackingSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_launch_template.DataAwsLaunchTemplateNetworkInterfacesConnectionTrackingSpecificationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeleteOnTermination() {
        return software.amazon.jsii.Kernel.get(this, "deleteOnTermination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDeviceIndex() {
        return software.amazon.jsii.Kernel.get(this, "deviceIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInterfaceType() {
        return software.amazon.jsii.Kernel.get(this, "interfaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv4AddressCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv4AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv4Addresses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv4Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv4PrefixCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv4PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv4Prefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv4Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv6AddressCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv6Addresses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv6Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv6PrefixCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv6PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv6Prefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv6Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNetworkCardIndex() {
        return software.amazon.jsii.Kernel.get(this, "networkCardIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryIpv6() {
        return software.amazon.jsii.Kernel.get(this, "primaryIpv6", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "privateIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_launch_template.DataAwsLaunchTemplateNetworkInterfaces getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_launch_template.DataAwsLaunchTemplateNetworkInterfaces.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_launch_template.DataAwsLaunchTemplateNetworkInterfaces value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
