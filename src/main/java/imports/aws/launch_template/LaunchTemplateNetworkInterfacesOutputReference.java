package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.523Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateNetworkInterfacesOutputReference")
public class LaunchTemplateNetworkInterfacesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplateNetworkInterfacesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplateNetworkInterfacesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public LaunchTemplateNetworkInterfacesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putConnectionTrackingSpecification(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putConnectionTrackingSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnaSrdSpecification(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putEnaSrdSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAssociateCarrierIpAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAssociateCarrierIpAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAssociatePublicIpAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAssociatePublicIpAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionTrackingSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionTrackingSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteOnTermination() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteOnTermination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceIndex() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceIndex", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnaSrdSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetEnaSrdSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInterfaceType() {
        software.amazon.jsii.Kernel.call(this, "resetInterfaceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv4AddressCount() {
        software.amazon.jsii.Kernel.call(this, "resetIpv4AddressCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv4Addresses() {
        software.amazon.jsii.Kernel.call(this, "resetIpv4Addresses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv4PrefixCount() {
        software.amazon.jsii.Kernel.call(this, "resetIpv4PrefixCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv4Prefixes() {
        software.amazon.jsii.Kernel.call(this, "resetIpv4Prefixes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6AddressCount() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6AddressCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Addresses() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Addresses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6PrefixCount() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6PrefixCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Prefixes() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Prefixes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkCardIndex() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkCardIndex", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInterfaceId() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInterfaceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrimaryIpv6() {
        software.amazon.jsii.Kernel.call(this, "resetPrimaryIpv6", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateIpAddress() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateIpAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecificationOutputReference getConnectionTrackingSpecification() {
        return software.amazon.jsii.Kernel.get(this, "connectionTrackingSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationOutputReference getEnaSrdSpecification() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssociateCarrierIpAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "associateCarrierIpAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssociatePublicIpAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "associatePublicIpAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification getConnectionTrackingSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionTrackingSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeleteOnTerminationInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteOnTerminationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDeviceIndexInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceIndexInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification getEnaSrdSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInterfaceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "interfaceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv4AddressCountInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv4AddressCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv4AddressesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv4AddressesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv4PrefixCountInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv4PrefixCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv4PrefixesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv4PrefixesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv6AddressCountInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6AddressesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv6AddressesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv6PrefixCountInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6PrefixCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6PrefixesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv6PrefixesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNetworkCardIndexInput() {
        return software.amazon.jsii.Kernel.get(this, "networkCardIndexInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrimaryIpv6Input() {
        return software.amazon.jsii.Kernel.get(this, "primaryIpv6Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivateIpAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "privateIpAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociateCarrierIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "associateCarrierIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssociateCarrierIpAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "associateCarrierIpAddress", java.util.Objects.requireNonNull(value, "associateCarrierIpAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociatePublicIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "associatePublicIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssociatePublicIpAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "associatePublicIpAddress", java.util.Objects.requireNonNull(value, "associatePublicIpAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeleteOnTermination() {
        return software.amazon.jsii.Kernel.get(this, "deleteOnTermination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeleteOnTermination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deleteOnTermination", java.util.Objects.requireNonNull(value, "deleteOnTermination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDeviceIndex() {
        return software.amazon.jsii.Kernel.get(this, "deviceIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDeviceIndex(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "deviceIndex", java.util.Objects.requireNonNull(value, "deviceIndex is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInterfaceType() {
        return software.amazon.jsii.Kernel.get(this, "interfaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInterfaceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "interfaceType", java.util.Objects.requireNonNull(value, "interfaceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv4AddressCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv4AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv4AddressCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv4AddressCount", java.util.Objects.requireNonNull(value, "ipv4AddressCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv4Addresses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv4Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv4Addresses(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv4Addresses", java.util.Objects.requireNonNull(value, "ipv4Addresses is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv4PrefixCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv4PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv4PrefixCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv4PrefixCount", java.util.Objects.requireNonNull(value, "ipv4PrefixCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv4Prefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv4Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv4Prefixes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv4Prefixes", java.util.Objects.requireNonNull(value, "ipv4Prefixes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv6AddressCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv6AddressCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv6AddressCount", java.util.Objects.requireNonNull(value, "ipv6AddressCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv6Addresses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv6Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv6Addresses(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Addresses", java.util.Objects.requireNonNull(value, "ipv6Addresses is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv6PrefixCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv6PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv6PrefixCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv6PrefixCount", java.util.Objects.requireNonNull(value, "ipv6PrefixCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv6Prefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv6Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv6Prefixes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Prefixes", java.util.Objects.requireNonNull(value, "ipv6Prefixes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNetworkCardIndex() {
        return software.amazon.jsii.Kernel.get(this, "networkCardIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNetworkCardIndex(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "networkCardIndex", java.util.Objects.requireNonNull(value, "networkCardIndex is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkInterfaceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkInterfaceId", java.util.Objects.requireNonNull(value, "networkInterfaceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryIpv6() {
        return software.amazon.jsii.Kernel.get(this, "primaryIpv6", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrimaryIpv6(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "primaryIpv6", java.util.Objects.requireNonNull(value, "primaryIpv6 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "privateIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrivateIpAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "privateIpAddress", java.util.Objects.requireNonNull(value, "privateIpAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetId", java.util.Objects.requireNonNull(value, "subnetId is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfaces value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
