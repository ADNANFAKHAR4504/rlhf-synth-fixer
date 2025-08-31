package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfigurationOutputReference")
public class EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDisk() {
        software.amazon.jsii.Kernel.call(this, "resetDisk", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCpuInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDiskInput() {
        return software.amazon.jsii.Kernel.get(this, "diskInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMemoryInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCpu() {
        return software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCpu(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cpu", java.util.Objects.requireNonNull(value, "cpu is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisk() {
        return software.amazon.jsii.Kernel.get(this, "disk", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDisk(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "disk", java.util.Objects.requireNonNull(value, "disk is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMemory() {
        return software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMemory(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "memory", java.util.Objects.requireNonNull(value, "memory is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
