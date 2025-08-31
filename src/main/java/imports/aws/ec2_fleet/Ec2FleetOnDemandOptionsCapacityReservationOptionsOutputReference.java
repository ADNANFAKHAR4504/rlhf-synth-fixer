package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference")
public class Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetUsageStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetUsageStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsageStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "usageStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsageStrategy() {
        return software.amazon.jsii.Kernel.get(this, "usageStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsageStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "usageStrategy", java.util.Objects.requireNonNull(value, "usageStrategy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
