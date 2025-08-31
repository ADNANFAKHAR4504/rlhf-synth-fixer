package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.080Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetTargetCapacitySpecificationOutputReference")
public class Ec2FleetTargetCapacitySpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2FleetTargetCapacitySpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2FleetTargetCapacitySpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2FleetTargetCapacitySpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOnDemandTargetCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandTargetCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotTargetCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetSpotTargetCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetCapacityUnitType() {
        software.amazon.jsii.Kernel.call(this, "resetTargetCapacityUnitType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultTargetCapacityTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultTargetCapacityTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOnDemandTargetCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandTargetCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSpotTargetCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "spotTargetCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetCapacityUnitTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacityUnitTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTotalTargetCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "totalTargetCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultTargetCapacityType() {
        return software.amazon.jsii.Kernel.get(this, "defaultTargetCapacityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultTargetCapacityType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultTargetCapacityType", java.util.Objects.requireNonNull(value, "defaultTargetCapacityType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOnDemandTargetCapacity() {
        return software.amazon.jsii.Kernel.get(this, "onDemandTargetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOnDemandTargetCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "onDemandTargetCapacity", java.util.Objects.requireNonNull(value, "onDemandTargetCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSpotTargetCapacity() {
        return software.amazon.jsii.Kernel.get(this, "spotTargetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSpotTargetCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "spotTargetCapacity", java.util.Objects.requireNonNull(value, "spotTargetCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetCapacityUnitType() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacityUnitType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetCapacityUnitType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetCapacityUnitType", java.util.Objects.requireNonNull(value, "targetCapacityUnitType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalTargetCapacity() {
        return software.amazon.jsii.Kernel.get(this, "totalTargetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTotalTargetCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "totalTargetCapacity", java.util.Objects.requireNonNull(value, "totalTargetCapacity is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetTargetCapacitySpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
