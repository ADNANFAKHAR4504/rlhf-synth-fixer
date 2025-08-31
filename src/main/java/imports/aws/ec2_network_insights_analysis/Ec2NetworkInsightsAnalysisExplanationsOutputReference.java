package imports.aws.ec2_network_insights_analysis;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.091Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2NetworkInsightsAnalysis.Ec2NetworkInsightsAnalysisExplanationsOutputReference")
public class Ec2NetworkInsightsAnalysisExplanationsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2NetworkInsightsAnalysisExplanationsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2NetworkInsightsAnalysisExplanationsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Ec2NetworkInsightsAnalysisExplanationsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsAclList getAcl() {
        return software.amazon.jsii.Kernel.get(this, "acl", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsAclList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsAclRuleList getAclRule() {
        return software.amazon.jsii.Kernel.get(this, "aclRule", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsAclRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAddress() {
        return software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAddresses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsAttachedToList getAttachedTo() {
        return software.amazon.jsii.Kernel.get(this, "attachedTo", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsAttachedToList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAvailabilityZones() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCidrs() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "cidrs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsClassicLoadBalancerListenerList getClassicLoadBalancerListener() {
        return software.amazon.jsii.Kernel.get(this, "classicLoadBalancerListener", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsClassicLoadBalancerListenerList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsComponentList getComponent() {
        return software.amazon.jsii.Kernel.get(this, "component", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsComponentList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsCustomerGatewayList getCustomerGateway() {
        return software.amazon.jsii.Kernel.get(this, "customerGateway", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsCustomerGatewayList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsDestinationList getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsDestinationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsDestinationVpcList getDestinationVpc() {
        return software.amazon.jsii.Kernel.get(this, "destinationVpc", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsDestinationVpcList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirection() {
        return software.amazon.jsii.Kernel.get(this, "direction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsElasticLoadBalancerListenerList getElasticLoadBalancerListener() {
        return software.amazon.jsii.Kernel.get(this, "elasticLoadBalancerListener", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsElasticLoadBalancerListenerList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExplanationCode() {
        return software.amazon.jsii.Kernel.get(this, "explanationCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsIngressRouteTableList getIngressRouteTable() {
        return software.amazon.jsii.Kernel.get(this, "ingressRouteTable", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsIngressRouteTableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsInternetGatewayList getInternetGateway() {
        return software.amazon.jsii.Kernel.get(this, "internetGateway", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsInternetGatewayList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoadBalancerArn() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLoadBalancerListenerPort() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerListenerPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsLoadBalancerTargetGroupList getLoadBalancerTargetGroup() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerTargetGroup", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsLoadBalancerTargetGroupList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsLoadBalancerTargetGroupsList getLoadBalancerTargetGroups() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerTargetGroups", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsLoadBalancerTargetGroupsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLoadBalancerTargetPort() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerTargetPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMissingComponent() {
        return software.amazon.jsii.Kernel.get(this, "missingComponent", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsNatGatewayList getNatGateway() {
        return software.amazon.jsii.Kernel.get(this, "natGateway", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsNatGatewayList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsNetworkInterfaceList getNetworkInterface() {
        return software.amazon.jsii.Kernel.get(this, "networkInterface", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsNetworkInterfaceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPacketField() {
        return software.amazon.jsii.Kernel.get(this, "packetField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsPortRangesList getPortRanges() {
        return software.amazon.jsii.Kernel.get(this, "portRanges", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsPortRangesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsPrefixListStructList getPrefixList() {
        return software.amazon.jsii.Kernel.get(this, "prefixList", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsPrefixListStructList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getProtocols() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "protocols", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsRouteTableList getRouteTable() {
        return software.amazon.jsii.Kernel.get(this, "routeTable", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsRouteTableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsRouteTableRouteList getRouteTableRoute() {
        return software.amazon.jsii.Kernel.get(this, "routeTableRoute", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsRouteTableRouteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSecurityGroupList getSecurityGroup() {
        return software.amazon.jsii.Kernel.get(this, "securityGroup", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSecurityGroupList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSecurityGroupRuleList getSecurityGroupRule() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupRule", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSecurityGroupRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSecurityGroupsList getSecurityGroups() {
        return software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSecurityGroupsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSourceVpcList getSourceVpc() {
        return software.amazon.jsii.Kernel.get(this, "sourceVpc", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSourceVpcList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSubnetList getSubnet() {
        return software.amazon.jsii.Kernel.get(this, "subnet", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSubnetList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSubnetRouteTableList getSubnetRouteTable() {
        return software.amazon.jsii.Kernel.get(this, "subnetRouteTable", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsSubnetRouteTableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsTransitGatewayList getTransitGateway() {
        return software.amazon.jsii.Kernel.get(this, "transitGateway", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsTransitGatewayList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsTransitGatewayAttachmentList getTransitGatewayAttachment() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayAttachment", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsTransitGatewayAttachmentList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsTransitGatewayRouteTableList getTransitGatewayRouteTable() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayRouteTable", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsTransitGatewayRouteTableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsTransitGatewayRouteTableRouteList getTransitGatewayRouteTableRoute() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayRouteTableRoute", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsTransitGatewayRouteTableRouteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpcList getVpc() {
        return software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpcList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpcEndpointList getVpcEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "vpcEndpoint", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpcEndpointList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpcPeeringConnectionList getVpcPeeringConnection() {
        return software.amazon.jsii.Kernel.get(this, "vpcPeeringConnection", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpcPeeringConnectionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpnConnectionList getVpnConnection() {
        return software.amazon.jsii.Kernel.get(this, "vpnConnection", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpnConnectionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpnGatewayList getVpnGateway() {
        return software.amazon.jsii.Kernel.get(this, "vpnGateway", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanationsVpnGatewayList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanations getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanations.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisExplanations value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
