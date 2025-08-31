package imports.aws.internetmonitor_monitor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.internetmonitorMonitor.InternetmonitorMonitorHealthEventsConfigOutputReference")
public class InternetmonitorMonitorHealthEventsConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected InternetmonitorMonitorHealthEventsConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected InternetmonitorMonitorHealthEventsConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public InternetmonitorMonitorHealthEventsConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAvailabilityScoreThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityScoreThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerformanceScoreThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetPerformanceScoreThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAvailabilityScoreThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityScoreThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPerformanceScoreThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "performanceScoreThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAvailabilityScoreThreshold() {
        return software.amazon.jsii.Kernel.get(this, "availabilityScoreThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAvailabilityScoreThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "availabilityScoreThreshold", java.util.Objects.requireNonNull(value, "availabilityScoreThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPerformanceScoreThreshold() {
        return software.amazon.jsii.Kernel.get(this, "performanceScoreThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPerformanceScoreThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "performanceScoreThreshold", java.util.Objects.requireNonNull(value, "performanceScoreThreshold is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.internetmonitor_monitor.InternetmonitorMonitorHealthEventsConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
