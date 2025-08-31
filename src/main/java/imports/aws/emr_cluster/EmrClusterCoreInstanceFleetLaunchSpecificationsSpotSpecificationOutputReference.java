package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.197Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecificationOutputReference")
public class EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetBlockDurationMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetBlockDurationMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBlockDurationMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "blockDurationMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimeoutActionInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutDurationMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutDurationMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAllocationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAllocationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "allocationStrategy", java.util.Objects.requireNonNull(value, "allocationStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBlockDurationMinutes() {
        return software.amazon.jsii.Kernel.get(this, "blockDurationMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBlockDurationMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "blockDurationMinutes", java.util.Objects.requireNonNull(value, "blockDurationMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimeoutAction() {
        return software.amazon.jsii.Kernel.get(this, "timeoutAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimeoutAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timeoutAction", java.util.Objects.requireNonNull(value, "timeoutAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutDurationMinutes() {
        return software.amazon.jsii.Kernel.get(this, "timeoutDurationMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutDurationMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutDurationMinutes", java.util.Objects.requireNonNull(value, "timeoutDurationMinutes is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterCoreInstanceFleetLaunchSpecificationsSpotSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
