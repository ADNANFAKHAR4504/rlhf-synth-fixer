package imports.aws.alb;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.905Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.alb.AlbSubnetMappingOutputReference")
public class AlbSubnetMappingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AlbSubnetMappingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AlbSubnetMappingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AlbSubnetMappingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAllocationId() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Address() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Address", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateIpv4Address() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateIpv4Address", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutpostId() {
        return software.amazon.jsii.Kernel.get(this, "outpostId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAllocationIdInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpv6AddressInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivateIpv4AddressInput() {
        return software.amazon.jsii.Kernel.get(this, "privateIpv4AddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAllocationId() {
        return software.amazon.jsii.Kernel.get(this, "allocationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAllocationId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "allocationId", java.util.Objects.requireNonNull(value, "allocationId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6Address() {
        return software.amazon.jsii.Kernel.get(this, "ipv6Address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpv6Address(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Address", java.util.Objects.requireNonNull(value, "ipv6Address is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateIpv4Address() {
        return software.amazon.jsii.Kernel.get(this, "privateIpv4Address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrivateIpv4Address(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "privateIpv4Address", java.util.Objects.requireNonNull(value, "privateIpv4Address is required"));
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

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.alb.AlbSubnetMapping value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
