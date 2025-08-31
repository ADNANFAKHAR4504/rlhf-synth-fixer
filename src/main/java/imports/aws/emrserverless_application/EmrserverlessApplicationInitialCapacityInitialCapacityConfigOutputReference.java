package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationInitialCapacityInitialCapacityConfigOutputReference")
public class EmrserverlessApplicationInitialCapacityInitialCapacityConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrserverlessApplicationInitialCapacityInitialCapacityConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrserverlessApplicationInitialCapacityInitialCapacityConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrserverlessApplicationInitialCapacityInitialCapacityConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putWorkerConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putWorkerConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetWorkerConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetWorkerConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfigurationOutputReference getWorkerConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "workerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration getWorkerConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "workerConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWorkerCountInput() {
        return software.amazon.jsii.Kernel.get(this, "workerCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWorkerCount() {
        return software.amazon.jsii.Kernel.get(this, "workerCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWorkerCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "workerCount", java.util.Objects.requireNonNull(value, "workerCount is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
