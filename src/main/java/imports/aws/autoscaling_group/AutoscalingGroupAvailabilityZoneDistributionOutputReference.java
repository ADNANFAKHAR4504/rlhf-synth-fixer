package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.091Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupAvailabilityZoneDistributionOutputReference")
public class AutoscalingGroupAvailabilityZoneDistributionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupAvailabilityZoneDistributionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupAvailabilityZoneDistributionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingGroupAvailabilityZoneDistributionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCapacityDistributionStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityDistributionStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCapacityDistributionStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityDistributionStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCapacityDistributionStrategy() {
        return software.amazon.jsii.Kernel.get(this, "capacityDistributionStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCapacityDistributionStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "capacityDistributionStrategy", java.util.Objects.requireNonNull(value, "capacityDistributionStrategy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupAvailabilityZoneDistribution value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
