package imports.aws.spot_instance_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.488Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotInstanceRequest.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTargetOutputReference")
public class SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCapacityReservationId() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityReservationResourceGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationResourceGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCapacityReservationIdInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCapacityReservationResourceGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationResourceGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCapacityReservationId() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCapacityReservationId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "capacityReservationId", java.util.Objects.requireNonNull(value, "capacityReservationId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCapacityReservationResourceGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCapacityReservationResourceGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "capacityReservationResourceGroupArn", java.util.Objects.requireNonNull(value, "capacityReservationResourceGroupArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
