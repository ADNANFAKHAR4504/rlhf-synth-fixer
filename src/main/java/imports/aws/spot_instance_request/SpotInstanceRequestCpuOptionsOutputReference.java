package imports.aws.spot_instance_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.488Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotInstanceRequest.SpotInstanceRequestCpuOptionsOutputReference")
public class SpotInstanceRequestCpuOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SpotInstanceRequestCpuOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SpotInstanceRequestCpuOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SpotInstanceRequestCpuOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAmdSevSnp() {
        software.amazon.jsii.Kernel.call(this, "resetAmdSevSnp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCoreCount() {
        software.amazon.jsii.Kernel.call(this, "resetCoreCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThreadsPerCore() {
        software.amazon.jsii.Kernel.call(this, "resetThreadsPerCore", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmdSevSnpInput() {
        return software.amazon.jsii.Kernel.get(this, "amdSevSnpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCoreCountInput() {
        return software.amazon.jsii.Kernel.get(this, "coreCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThreadsPerCoreInput() {
        return software.amazon.jsii.Kernel.get(this, "threadsPerCoreInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmdSevSnp() {
        return software.amazon.jsii.Kernel.get(this, "amdSevSnp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmdSevSnp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "amdSevSnp", java.util.Objects.requireNonNull(value, "amdSevSnp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCoreCount() {
        return software.amazon.jsii.Kernel.get(this, "coreCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCoreCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "coreCount", java.util.Objects.requireNonNull(value, "coreCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getThreadsPerCore() {
        return software.amazon.jsii.Kernel.get(this, "threadsPerCore", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setThreadsPerCore(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "threadsPerCore", java.util.Objects.requireNonNull(value, "threadsPerCore is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
