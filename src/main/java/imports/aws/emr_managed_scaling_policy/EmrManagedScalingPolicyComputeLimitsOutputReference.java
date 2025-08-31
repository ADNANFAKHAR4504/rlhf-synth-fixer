package imports.aws.emr_managed_scaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.205Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrManagedScalingPolicy.EmrManagedScalingPolicyComputeLimitsOutputReference")
public class EmrManagedScalingPolicyComputeLimitsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrManagedScalingPolicyComputeLimitsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrManagedScalingPolicyComputeLimitsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public EmrManagedScalingPolicyComputeLimitsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetMaximumCoreCapacityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumCoreCapacityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumOndemandCapacityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumOndemandCapacityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumCoreCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumCoreCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumOndemandCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumOndemandCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinimumCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUnitTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "unitTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "maximumCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumCapacityUnits", java.util.Objects.requireNonNull(value, "maximumCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumCoreCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "maximumCoreCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumCoreCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumCoreCapacityUnits", java.util.Objects.requireNonNull(value, "maximumCoreCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumOndemandCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "maximumOndemandCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumOndemandCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumOndemandCapacityUnits", java.util.Objects.requireNonNull(value, "maximumOndemandCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimumCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "minimumCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinimumCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minimumCapacityUnits", java.util.Objects.requireNonNull(value, "minimumCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUnitType() {
        return software.amazon.jsii.Kernel.get(this, "unitType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUnitType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "unitType", java.util.Objects.requireNonNull(value, "unitType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emr_managed_scaling_policy.EmrManagedScalingPolicyComputeLimits value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
