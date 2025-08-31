package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.218Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterScalingGroupConfigurationOutputReference")
public class FinspaceKxClusterScalingGroupConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FinspaceKxClusterScalingGroupConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxClusterScalingGroupConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FinspaceKxClusterScalingGroupConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCpu() {
        software.amazon.jsii.Kernel.call(this, "resetCpu", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemoryLimit() {
        software.amazon.jsii.Kernel.call(this, "resetMemoryLimit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCpuInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMemoryLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMemoryReservationInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryReservationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNodeCountInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScalingGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCpu() {
        return software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCpu(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cpu", java.util.Objects.requireNonNull(value, "cpu is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMemoryLimit() {
        return software.amazon.jsii.Kernel.get(this, "memoryLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMemoryLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "memoryLimit", java.util.Objects.requireNonNull(value, "memoryLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMemoryReservation() {
        return software.amazon.jsii.Kernel.get(this, "memoryReservation", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMemoryReservation(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "memoryReservation", java.util.Objects.requireNonNull(value, "memoryReservation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNodeCount() {
        return software.amazon.jsii.Kernel.get(this, "nodeCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNodeCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "nodeCount", java.util.Objects.requireNonNull(value, "nodeCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScalingGroupName() {
        return software.amazon.jsii.Kernel.get(this, "scalingGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScalingGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scalingGroupName", java.util.Objects.requireNonNull(value, "scalingGroupName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
