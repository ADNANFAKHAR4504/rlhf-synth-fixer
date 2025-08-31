package imports.aws.data_aws_ec2_network_insights_analysis;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.595Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEc2NetworkInsightsAnalysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsOutputReference")
public class DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsAclRuleList getAclRule() {
        return software.amazon.jsii.Kernel.get(this, "aclRule", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsAclRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsAdditionalDetailsList getAdditionalDetails() {
        return software.amazon.jsii.Kernel.get(this, "additionalDetails", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsAdditionalDetailsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsAttachedToList getAttachedTo() {
        return software.amazon.jsii.Kernel.get(this, "attachedTo", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsAttachedToList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsComponentList getComponent() {
        return software.amazon.jsii.Kernel.get(this, "component", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsComponentList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsDestinationVpcList getDestinationVpc() {
        return software.amazon.jsii.Kernel.get(this, "destinationVpc", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsDestinationVpcList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsInboundHeaderList getInboundHeader() {
        return software.amazon.jsii.Kernel.get(this, "inboundHeader", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsInboundHeaderList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsOutboundHeaderList getOutboundHeader() {
        return software.amazon.jsii.Kernel.get(this, "outboundHeader", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsOutboundHeaderList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsRouteTableRouteList getRouteTableRoute() {
        return software.amazon.jsii.Kernel.get(this, "routeTableRoute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsRouteTableRouteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsSecurityGroupRuleList getSecurityGroupRule() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupRule", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsSecurityGroupRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSequenceNumber() {
        return software.amazon.jsii.Kernel.get(this, "sequenceNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsSourceVpcList getSourceVpc() {
        return software.amazon.jsii.Kernel.get(this, "sourceVpc", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsSourceVpcList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsSubnetList getSubnet() {
        return software.amazon.jsii.Kernel.get(this, "subnet", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsSubnetList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsTransitGatewayList getTransitGateway() {
        return software.amazon.jsii.Kernel.get(this, "transitGateway", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsTransitGatewayList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsTransitGatewayRouteTableRouteList getTransitGatewayRouteTableRoute() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayRouteTableRoute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsTransitGatewayRouteTableRouteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsVpcList getVpc() {
        return software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponentsVpcList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponents getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponents.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisForwardPathComponents value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
