package imports.aws.neptune_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.929Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.neptuneCluster.NeptuneClusterServerlessV2ScalingConfigurationOutputReference")
public class NeptuneClusterServerlessV2ScalingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NeptuneClusterServerlessV2ScalingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NeptuneClusterServerlessV2ScalingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NeptuneClusterServerlessV2ScalingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaxCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetMaxCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetMinCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "minCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxCapacity() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxCapacity", java.util.Objects.requireNonNull(value, "maxCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinCapacity() {
        return software.amazon.jsii.Kernel.get(this, "minCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minCapacity", java.util.Objects.requireNonNull(value, "minCapacity is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
