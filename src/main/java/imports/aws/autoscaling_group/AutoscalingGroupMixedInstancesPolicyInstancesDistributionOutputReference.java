package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.097Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference")
public class AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOnDemandAllocationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandAllocationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnDemandBaseCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandBaseCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnDemandPercentageAboveBaseCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandPercentageAboveBaseCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotAllocationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetSpotAllocationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotInstancePools() {
        software.amazon.jsii.Kernel.call(this, "resetSpotInstancePools", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotMaxPrice() {
        software.amazon.jsii.Kernel.call(this, "resetSpotMaxPrice", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnDemandAllocationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandAllocationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOnDemandBaseCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandBaseCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOnDemandPercentageAboveBaseCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandPercentageAboveBaseCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpotAllocationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "spotAllocationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSpotInstancePoolsInput() {
        return software.amazon.jsii.Kernel.get(this, "spotInstancePoolsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpotMaxPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "spotMaxPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnDemandAllocationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "onDemandAllocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnDemandAllocationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onDemandAllocationStrategy", java.util.Objects.requireNonNull(value, "onDemandAllocationStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOnDemandBaseCapacity() {
        return software.amazon.jsii.Kernel.get(this, "onDemandBaseCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOnDemandBaseCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "onDemandBaseCapacity", java.util.Objects.requireNonNull(value, "onDemandBaseCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOnDemandPercentageAboveBaseCapacity() {
        return software.amazon.jsii.Kernel.get(this, "onDemandPercentageAboveBaseCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOnDemandPercentageAboveBaseCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "onDemandPercentageAboveBaseCapacity", java.util.Objects.requireNonNull(value, "onDemandPercentageAboveBaseCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotAllocationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "spotAllocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpotAllocationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spotAllocationStrategy", java.util.Objects.requireNonNull(value, "spotAllocationStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSpotInstancePools() {
        return software.amazon.jsii.Kernel.get(this, "spotInstancePools", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSpotInstancePools(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "spotInstancePools", java.util.Objects.requireNonNull(value, "spotInstancePools is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotMaxPrice() {
        return software.amazon.jsii.Kernel.get(this, "spotMaxPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpotMaxPrice(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spotMaxPrice", java.util.Objects.requireNonNull(value, "spotMaxPrice is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyInstancesDistribution getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyInstancesDistribution.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyInstancesDistribution value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
