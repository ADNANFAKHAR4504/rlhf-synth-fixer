package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.091Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference")
public class AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCapacityReservationIds() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityReservationResourceGroupArns() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationResourceGroupArns", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCapacityReservationIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "capacityReservationIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCapacityReservationResourceGroupArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "capacityReservationResourceGroupArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCapacityReservationIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "capacityReservationIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCapacityReservationIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "capacityReservationIds", java.util.Objects.requireNonNull(value, "capacityReservationIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCapacityReservationResourceGroupArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "capacityReservationResourceGroupArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCapacityReservationResourceGroupArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "capacityReservationResourceGroupArns", java.util.Objects.requireNonNull(value, "capacityReservationResourceGroupArns is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
