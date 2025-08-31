package imports.aws.codebuild_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.298Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildFleet.CodebuildFleetComputeConfigurationOutputReference")
public class CodebuildFleetComputeConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildFleetComputeConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildFleetComputeConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildFleetComputeConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDisk() {
        software.amazon.jsii.Kernel.call(this, "resetDisk", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMachineType() {
        software.amazon.jsii.Kernel.call(this, "resetMachineType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemory() {
        software.amazon.jsii.Kernel.call(this, "resetMemory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVcpu() {
        software.amazon.jsii.Kernel.call(this, "resetVcpu", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDiskInput() {
        return software.amazon.jsii.Kernel.get(this, "diskInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMachineTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "machineTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMemoryInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVcpuInput() {
        return software.amazon.jsii.Kernel.get(this, "vcpuInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDisk() {
        return software.amazon.jsii.Kernel.get(this, "disk", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDisk(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "disk", java.util.Objects.requireNonNull(value, "disk is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMachineType() {
        return software.amazon.jsii.Kernel.get(this, "machineType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMachineType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "machineType", java.util.Objects.requireNonNull(value, "machineType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMemory() {
        return software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMemory(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "memory", java.util.Objects.requireNonNull(value, "memory is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVcpu() {
        return software.amazon.jsii.Kernel.get(this, "vcpu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVcpu(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "vcpu", java.util.Objects.requireNonNull(value, "vcpu is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
