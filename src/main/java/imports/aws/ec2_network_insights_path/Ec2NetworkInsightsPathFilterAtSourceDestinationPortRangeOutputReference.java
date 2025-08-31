package imports.aws.ec2_network_insights_path;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.101Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference")
public class Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFromPort() {
        software.amazon.jsii.Kernel.call(this, "resetFromPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetToPort() {
        software.amazon.jsii.Kernel.call(this, "resetToPort", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFromPortInput() {
        return software.amazon.jsii.Kernel.get(this, "fromPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getToPortInput() {
        return software.amazon.jsii.Kernel.get(this, "toPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFromPort() {
        return software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFromPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fromPort", java.util.Objects.requireNonNull(value, "fromPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getToPort() {
        return software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setToPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "toPort", java.util.Objects.requireNonNull(value, "toPort is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
