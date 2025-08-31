package imports.aws.ec2_network_insights_analysis;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2NetworkInsightsAnalysis.Ec2NetworkInsightsAnalysisReturnPathComponentsOutputReference")
public class Ec2NetworkInsightsAnalysisReturnPathComponentsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2NetworkInsightsAnalysisReturnPathComponentsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2NetworkInsightsAnalysisReturnPathComponentsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Ec2NetworkInsightsAnalysisReturnPathComponentsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsAclRuleList getAclRule() {
        return software.amazon.jsii.Kernel.get(this, "aclRule", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsAclRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsAdditionalDetailsList getAdditionalDetails() {
        return software.amazon.jsii.Kernel.get(this, "additionalDetails", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsAdditionalDetailsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsAttachedToList getAttachedTo() {
        return software.amazon.jsii.Kernel.get(this, "attachedTo", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsAttachedToList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsComponentList getComponent() {
        return software.amazon.jsii.Kernel.get(this, "component", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsComponentList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsDestinationVpcList getDestinationVpc() {
        return software.amazon.jsii.Kernel.get(this, "destinationVpc", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsDestinationVpcList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsInboundHeaderList getInboundHeader() {
        return software.amazon.jsii.Kernel.get(this, "inboundHeader", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsInboundHeaderList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsOutboundHeaderList getOutboundHeader() {
        return software.amazon.jsii.Kernel.get(this, "outboundHeader", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsOutboundHeaderList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsRouteTableRouteList getRouteTableRoute() {
        return software.amazon.jsii.Kernel.get(this, "routeTableRoute", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsRouteTableRouteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsSecurityGroupRuleList getSecurityGroupRule() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupRule", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsSecurityGroupRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSequenceNumber() {
        return software.amazon.jsii.Kernel.get(this, "sequenceNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsSourceVpcList getSourceVpc() {
        return software.amazon.jsii.Kernel.get(this, "sourceVpc", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsSourceVpcList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsSubnetList getSubnet() {
        return software.amazon.jsii.Kernel.get(this, "subnet", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsSubnetList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsTransitGatewayList getTransitGateway() {
        return software.amazon.jsii.Kernel.get(this, "transitGateway", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsTransitGatewayList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsTransitGatewayRouteTableRouteList getTransitGatewayRouteTableRoute() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayRouteTableRoute", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsTransitGatewayRouteTableRouteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsVpcList getVpc() {
        return software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponentsVpcList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponents getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponents.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_analysis.Ec2NetworkInsightsAnalysisReturnPathComponents value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
