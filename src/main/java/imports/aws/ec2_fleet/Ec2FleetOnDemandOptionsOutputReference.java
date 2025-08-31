package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetOnDemandOptionsOutputReference")
public class Ec2FleetOnDemandOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2FleetOnDemandOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2FleetOnDemandOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2FleetOnDemandOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCapacityReservationOptions(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCapacityReservationOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllocationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityReservationOptions() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationOptions", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference getCapacityReservationOptions() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions getCapacityReservationOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetOnDemandOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetOnDemandOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetOnDemandOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
