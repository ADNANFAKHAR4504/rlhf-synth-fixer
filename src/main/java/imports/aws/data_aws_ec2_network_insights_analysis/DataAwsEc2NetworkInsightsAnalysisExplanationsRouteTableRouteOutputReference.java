package imports.aws.data_aws_ec2_network_insights_analysis;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.592Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEc2NetworkInsightsAnalysis.DataAwsEc2NetworkInsightsAnalysisExplanationsRouteTableRouteOutputReference")
public class DataAwsEc2NetworkInsightsAnalysisExplanationsRouteTableRouteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsEc2NetworkInsightsAnalysisExplanationsRouteTableRouteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsEc2NetworkInsightsAnalysisExplanationsRouteTableRouteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsEc2NetworkInsightsAnalysisExplanationsRouteTableRouteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationCidr() {
        return software.amazon.jsii.Kernel.get(this, "destinationCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationPrefixListId() {
        return software.amazon.jsii.Kernel.get(this, "destinationPrefixListId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEgressOnlyInternetGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "egressOnlyInternetGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "gatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceId() {
        return software.amazon.jsii.Kernel.get(this, "instanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNatGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "natGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrigin() {
        return software.amazon.jsii.Kernel.get(this, "origin", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcPeeringConnectionId() {
        return software.amazon.jsii.Kernel.get(this, "vpcPeeringConnectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisExplanationsRouteTableRoute getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisExplanationsRouteTableRoute.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_ec2_network_insights_analysis.DataAwsEc2NetworkInsightsAnalysisExplanationsRouteTableRoute value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
