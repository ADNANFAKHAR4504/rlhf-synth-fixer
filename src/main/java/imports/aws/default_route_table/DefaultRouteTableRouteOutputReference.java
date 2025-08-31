package imports.aws.default_route_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.983Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.defaultRouteTable.DefaultRouteTableRouteOutputReference")
public class DefaultRouteTableRouteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DefaultRouteTableRouteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DefaultRouteTableRouteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DefaultRouteTableRouteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetCidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetCidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCoreNetworkArn() {
        software.amazon.jsii.Kernel.call(this, "resetCoreNetworkArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationPrefixListId() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationPrefixListId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEgressOnlyGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetEgressOnlyGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceId() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6CidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6CidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNatGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetNatGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInterfaceId() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInterfaceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetTransitGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcEndpointId() {
        software.amazon.jsii.Kernel.call(this, "resetVpcEndpointId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcPeeringConnectionId() {
        software.amazon.jsii.Kernel.call(this, "resetVpcPeeringConnectionId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "cidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCoreNetworkArnInput() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationPrefixListIdInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationPrefixListIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEgressOnlyGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "egressOnlyGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNatGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "natGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcEndpointIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcPeeringConnectionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcPeeringConnectionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cidrBlock", java.util.Objects.requireNonNull(value, "cidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCoreNetworkArn() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCoreNetworkArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "coreNetworkArn", java.util.Objects.requireNonNull(value, "coreNetworkArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationPrefixListId() {
        return software.amazon.jsii.Kernel.get(this, "destinationPrefixListId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationPrefixListId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationPrefixListId", java.util.Objects.requireNonNull(value, "destinationPrefixListId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEgressOnlyGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "egressOnlyGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEgressOnlyGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "egressOnlyGatewayId", java.util.Objects.requireNonNull(value, "egressOnlyGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "gatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayId", java.util.Objects.requireNonNull(value, "gatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceId() {
        return software.amazon.jsii.Kernel.get(this, "instanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceId", java.util.Objects.requireNonNull(value, "instanceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6CidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpv6CidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipv6CidrBlock", java.util.Objects.requireNonNull(value, "ipv6CidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNatGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "natGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNatGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "natGatewayId", java.util.Objects.requireNonNull(value, "natGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkInterfaceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkInterfaceId", java.util.Objects.requireNonNull(value, "networkInterfaceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayId", java.util.Objects.requireNonNull(value, "transitGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcEndpointId() {
        return software.amazon.jsii.Kernel.get(this, "vpcEndpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcEndpointId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcEndpointId", java.util.Objects.requireNonNull(value, "vpcEndpointId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcPeeringConnectionId() {
        return software.amazon.jsii.Kernel.get(this, "vpcPeeringConnectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcPeeringConnectionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcPeeringConnectionId", java.util.Objects.requireNonNull(value, "vpcPeeringConnectionId is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.default_route_table.DefaultRouteTableRoute value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
