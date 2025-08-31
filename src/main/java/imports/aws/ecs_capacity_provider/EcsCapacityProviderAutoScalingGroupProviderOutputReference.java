package imports.aws.ecs_capacity_provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.128Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCapacityProvider.EcsCapacityProviderAutoScalingGroupProviderOutputReference")
public class EcsCapacityProviderAutoScalingGroupProviderOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsCapacityProviderAutoScalingGroupProviderOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsCapacityProviderAutoScalingGroupProviderOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsCapacityProviderAutoScalingGroupProviderOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putManagedScaling(final @org.jetbrains.annotations.NotNull imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProviderManagedScaling value) {
        software.amazon.jsii.Kernel.call(this, "putManagedScaling", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetManagedDraining() {
        software.amazon.jsii.Kernel.call(this, "resetManagedDraining", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedScaling() {
        software.amazon.jsii.Kernel.call(this, "resetManagedScaling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedTerminationProtection() {
        software.amazon.jsii.Kernel.call(this, "resetManagedTerminationProtection", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProviderManagedScalingOutputReference getManagedScaling() {
        return software.amazon.jsii.Kernel.get(this, "managedScaling", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProviderManagedScalingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoScalingGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getManagedDrainingInput() {
        return software.amazon.jsii.Kernel.get(this, "managedDrainingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProviderManagedScaling getManagedScalingInput() {
        return software.amazon.jsii.Kernel.get(this, "managedScalingInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProviderManagedScaling.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getManagedTerminationProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "managedTerminationProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoScalingGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoScalingGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoScalingGroupArn", java.util.Objects.requireNonNull(value, "autoScalingGroupArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getManagedDraining() {
        return software.amazon.jsii.Kernel.get(this, "managedDraining", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setManagedDraining(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "managedDraining", java.util.Objects.requireNonNull(value, "managedDraining is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getManagedTerminationProtection() {
        return software.amazon.jsii.Kernel.get(this, "managedTerminationProtection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setManagedTerminationProtection(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "managedTerminationProtection", java.util.Objects.requireNonNull(value, "managedTerminationProtection is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProvider getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProvider.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_capacity_provider.EcsCapacityProviderAutoScalingGroupProvider value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
