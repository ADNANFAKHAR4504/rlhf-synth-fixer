package imports.aws.ec2_network_insights_path;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.101Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceOutputReference")
public class Ec2NetworkInsightsPathFilterAtSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2NetworkInsightsPathFilterAtSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2NetworkInsightsPathFilterAtSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2NetworkInsightsPathFilterAtSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDestinationPortRange(final @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange value) {
        software.amazon.jsii.Kernel.call(this, "putDestinationPortRange", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourcePortRange(final @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceSourcePortRange value) {
        software.amazon.jsii.Kernel.call(this, "putSourcePortRange", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDestinationAddress() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationPortRange() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationPortRange", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceAddress() {
        software.amazon.jsii.Kernel.call(this, "resetSourceAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourcePortRange() {
        software.amazon.jsii.Kernel.call(this, "resetSourcePortRange", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference getDestinationPortRange() {
        return software.amazon.jsii.Kernel.get(this, "destinationPortRange", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceSourcePortRangeOutputReference getSourcePortRange() {
        return software.amazon.jsii.Kernel.get(this, "sourcePortRange", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceSourcePortRangeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange getDestinationPortRangeInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationPortRangeInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceSourcePortRange getSourcePortRangeInput() {
        return software.amazon.jsii.Kernel.get(this, "sourcePortRangeInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceSourcePortRange.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationAddress() {
        return software.amazon.jsii.Kernel.get(this, "destinationAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationAddress", java.util.Objects.requireNonNull(value, "destinationAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceAddress() {
        return software.amazon.jsii.Kernel.get(this, "sourceAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceAddress", java.util.Objects.requireNonNull(value, "sourceAddress is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
