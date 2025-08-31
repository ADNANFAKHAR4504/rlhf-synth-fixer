package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.080Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference")
public class Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetReplacementStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetReplacementStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminationDelay() {
        software.amazon.jsii.Kernel.call(this, "resetTerminationDelay", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplacementStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "replacementStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTerminationDelayInput() {
        return software.amazon.jsii.Kernel.get(this, "terminationDelayInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplacementStrategy() {
        return software.amazon.jsii.Kernel.get(this, "replacementStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplacementStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replacementStrategy", java.util.Objects.requireNonNull(value, "replacementStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTerminationDelay() {
        return software.amazon.jsii.Kernel.get(this, "terminationDelay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTerminationDelay(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "terminationDelay", java.util.Objects.requireNonNull(value, "terminationDelay is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
