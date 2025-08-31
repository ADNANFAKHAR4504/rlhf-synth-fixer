package imports.aws.appstream_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamFleet.AppstreamFleetComputeCapacityOutputReference")
public class AppstreamFleetComputeCapacityOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppstreamFleetComputeCapacityOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppstreamFleetComputeCapacityOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppstreamFleetComputeCapacityOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDesiredInstances() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredInstances", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesiredSessions() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredSessions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAvailable() {
        return software.amazon.jsii.Kernel.get(this, "available", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInUse() {
        return software.amazon.jsii.Kernel.get(this, "inUse", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRunning() {
        return software.amazon.jsii.Kernel.get(this, "running", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDesiredInstancesInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredInstancesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDesiredSessionsInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredSessionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredInstances() {
        return software.amazon.jsii.Kernel.get(this, "desiredInstances", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDesiredInstances(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "desiredInstances", java.util.Objects.requireNonNull(value, "desiredInstances is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredSessions() {
        return software.amazon.jsii.Kernel.get(this, "desiredSessions", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDesiredSessions(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "desiredSessions", java.util.Objects.requireNonNull(value, "desiredSessions is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appstream_fleet.AppstreamFleetComputeCapacity getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetComputeCapacity.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appstream_fleet.AppstreamFleetComputeCapacity value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
