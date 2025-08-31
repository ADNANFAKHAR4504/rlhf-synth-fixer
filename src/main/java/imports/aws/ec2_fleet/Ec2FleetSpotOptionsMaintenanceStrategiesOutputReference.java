package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.080Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference")
public class Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCapacityRebalance(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance value) {
        software.amazon.jsii.Kernel.call(this, "putCapacityRebalance", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCapacityRebalance() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityRebalance", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference getCapacityRebalance() {
        return software.amazon.jsii.Kernel.get(this, "capacityRebalance", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance getCapacityRebalanceInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityRebalanceInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
