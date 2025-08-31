package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.080Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetSpotOptionsOutputReference")
public class Ec2FleetSpotOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2FleetSpotOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2FleetSpotOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2FleetSpotOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMaintenanceStrategies(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies value) {
        software.amazon.jsii.Kernel.call(this, "putMaintenanceStrategies", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllocationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceInterruptionBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceInterruptionBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstancePoolsToUseCount() {
        software.amazon.jsii.Kernel.call(this, "resetInstancePoolsToUseCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaintenanceStrategies() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceStrategies", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxTotalPrice() {
        software.amazon.jsii.Kernel.call(this, "resetMaxTotalPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinTargetCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetMinTargetCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSingleAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetSingleAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSingleInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetSingleInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference getMaintenanceStrategies() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceStrategies", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceInterruptionBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInstancePoolsToUseCountInput() {
        return software.amazon.jsii.Kernel.get(this, "instancePoolsToUseCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies getMaintenanceStrategiesInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceStrategiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxTotalPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "maxTotalPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinTargetCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "minTargetCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSingleAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "singleAvailabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSingleInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "singleInstanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAllocationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAllocationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "allocationStrategy", java.util.Objects.requireNonNull(value, "allocationStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceInterruptionBehavior() {
        return software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceInterruptionBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceInterruptionBehavior", java.util.Objects.requireNonNull(value, "instanceInterruptionBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstancePoolsToUseCount() {
        return software.amazon.jsii.Kernel.get(this, "instancePoolsToUseCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInstancePoolsToUseCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "instancePoolsToUseCount", java.util.Objects.requireNonNull(value, "instancePoolsToUseCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxTotalPrice() {
        return software.amazon.jsii.Kernel.get(this, "maxTotalPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxTotalPrice(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxTotalPrice", java.util.Objects.requireNonNull(value, "maxTotalPrice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinTargetCapacity() {
        return software.amazon.jsii.Kernel.get(this, "minTargetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinTargetCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minTargetCapacity", java.util.Objects.requireNonNull(value, "minTargetCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSingleAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "singleAvailabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSingleAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "singleAvailabilityZone", java.util.Objects.requireNonNull(value, "singleAvailabilityZone is required"));
    }

    public void setSingleAvailabilityZone(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "singleAvailabilityZone", java.util.Objects.requireNonNull(value, "singleAvailabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSingleInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "singleInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSingleInstanceType(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "singleInstanceType", java.util.Objects.requireNonNull(value, "singleInstanceType is required"));
    }

    public void setSingleInstanceType(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "singleInstanceType", java.util.Objects.requireNonNull(value, "singleInstanceType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
