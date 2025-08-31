package imports.aws.opsworks_java_app_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.019Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksJavaAppLayer.OpsworksJavaAppLayerLoadBasedAutoScalingUpscalingOutputReference")
public class OpsworksJavaAppLayerLoadBasedAutoScalingUpscalingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpsworksJavaAppLayerLoadBasedAutoScalingUpscalingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksJavaAppLayerLoadBasedAutoScalingUpscalingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpsworksJavaAppLayerLoadBasedAutoScalingUpscalingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAlarms() {
        software.amazon.jsii.Kernel.call(this, "resetAlarms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCpuThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetCpuThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIgnoreMetricsTime() {
        software.amazon.jsii.Kernel.call(this, "resetIgnoreMetricsTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceCount() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetLoadThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemoryThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetMemoryThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThresholdsWaitTime() {
        software.amazon.jsii.Kernel.call(this, "resetThresholdsWaitTime", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAlarmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "alarmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCpuThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIgnoreMetricsTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "ignoreMetricsTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInstanceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLoadThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "loadThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMemoryThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThresholdsWaitTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "thresholdsWaitTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAlarms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "alarms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAlarms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "alarms", java.util.Objects.requireNonNull(value, "alarms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCpuThreshold() {
        return software.amazon.jsii.Kernel.get(this, "cpuThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCpuThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cpuThreshold", java.util.Objects.requireNonNull(value, "cpuThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIgnoreMetricsTime() {
        return software.amazon.jsii.Kernel.get(this, "ignoreMetricsTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIgnoreMetricsTime(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ignoreMetricsTime", java.util.Objects.requireNonNull(value, "ignoreMetricsTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstanceCount() {
        return software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInstanceCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "instanceCount", java.util.Objects.requireNonNull(value, "instanceCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLoadThreshold() {
        return software.amazon.jsii.Kernel.get(this, "loadThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLoadThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "loadThreshold", java.util.Objects.requireNonNull(value, "loadThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMemoryThreshold() {
        return software.amazon.jsii.Kernel.get(this, "memoryThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMemoryThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "memoryThreshold", java.util.Objects.requireNonNull(value, "memoryThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getThresholdsWaitTime() {
        return software.amazon.jsii.Kernel.get(this, "thresholdsWaitTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setThresholdsWaitTime(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "thresholdsWaitTime", java.util.Objects.requireNonNull(value, "thresholdsWaitTime is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_java_app_layer.OpsworksJavaAppLayerLoadBasedAutoScalingUpscaling getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_java_app_layer.OpsworksJavaAppLayerLoadBasedAutoScalingUpscaling.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opsworks_java_app_layer.OpsworksJavaAppLayerLoadBasedAutoScalingUpscaling value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
