package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterAutoScalingConfigurationOutputReference")
public class FinspaceKxClusterAutoScalingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FinspaceKxClusterAutoScalingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxClusterAutoScalingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FinspaceKxClusterAutoScalingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoScalingMetricInput() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingMetricInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxNodeCountInput() {
        return software.amazon.jsii.Kernel.get(this, "maxNodeCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMetricTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "metricTargetInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinNodeCountInput() {
        return software.amazon.jsii.Kernel.get(this, "minNodeCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScaleInCooldownSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleInCooldownSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScaleOutCooldownSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleOutCooldownSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoScalingMetric() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingMetric", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoScalingMetric(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoScalingMetric", java.util.Objects.requireNonNull(value, "autoScalingMetric is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxNodeCount() {
        return software.amazon.jsii.Kernel.get(this, "maxNodeCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxNodeCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxNodeCount", java.util.Objects.requireNonNull(value, "maxNodeCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMetricTarget() {
        return software.amazon.jsii.Kernel.get(this, "metricTarget", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMetricTarget(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "metricTarget", java.util.Objects.requireNonNull(value, "metricTarget is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinNodeCount() {
        return software.amazon.jsii.Kernel.get(this, "minNodeCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinNodeCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minNodeCount", java.util.Objects.requireNonNull(value, "minNodeCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScaleInCooldownSeconds() {
        return software.amazon.jsii.Kernel.get(this, "scaleInCooldownSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScaleInCooldownSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scaleInCooldownSeconds", java.util.Objects.requireNonNull(value, "scaleInCooldownSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScaleOutCooldownSeconds() {
        return software.amazon.jsii.Kernel.get(this, "scaleOutCooldownSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScaleOutCooldownSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scaleOutCooldownSeconds", java.util.Objects.requireNonNull(value, "scaleOutCooldownSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
