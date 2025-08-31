package imports.aws.ecs_capacity_provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.128Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCapacityProvider.EcsCapacityProviderAutoScalingGroupProviderManagedScalingOutputReference")
public class EcsCapacityProviderAutoScalingGroupProviderManagedScalingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsCapacityProviderAutoScalingGroupProviderManagedScalingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsCapacityProviderAutoScalingGroupProviderManagedScalingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsCapacityProviderAutoScalingGroupProviderManagedScalingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetInstanceWarmupPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceWarmupPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumScalingStepSize() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumScalingStepSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumScalingStepSize() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumScalingStepSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetTargetCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInstanceWarmupPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceWarmupPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumScalingStepSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumScalingStepSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinimumScalingStepSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumScalingStepSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstanceWarmupPeriod() {
        return software.amazon.jsii.Kernel.get(this, "instanceWarmupPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInstanceWarmupPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "instanceWarmupPeriod", java.util.Objects.requireNonNull(value, "instanceWarmupPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumScalingStepSize() {
        return software.amazon.jsii.Kernel.get(this, "maximumScalingStepSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumScalingStepSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumScalingStepSize", java.util.Objects.requireNonNull(value, "maximumScalingStepSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimumScalingStepSize() {
        return software.amazon.jsii.Kernel.get(this, "minimumScalingStepSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinimumScalingStepSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minimumScalingStepSize", java.util.Objects.requireNonNull(value, "minimumScalingStepSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetCapacity() {
        return software.amazon.jsii.Kernel.get(this, "targetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetCapacity", java.util.Objects.requireNonNull(value, "targetCapacity is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProviderManagedScaling getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProviderManagedScaling.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProviderManagedScaling value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
