package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriverOutputReference")
public class EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriverOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriverOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriverOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriverOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEntryPointArguments() {
        software.amazon.jsii.Kernel.call(this, "resetEntryPointArguments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSparkSubmitParameters() {
        software.amazon.jsii.Kernel.call(this, "resetSparkSubmitParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEntryPointArgumentsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "entryPointArgumentsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEntryPointInput() {
        return software.amazon.jsii.Kernel.get(this, "entryPointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSparkSubmitParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "sparkSubmitParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEntryPoint() {
        return software.amazon.jsii.Kernel.get(this, "entryPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEntryPoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "entryPoint", java.util.Objects.requireNonNull(value, "entryPoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEntryPointArguments() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "entryPointArguments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEntryPointArguments(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "entryPointArguments", java.util.Objects.requireNonNull(value, "entryPointArguments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSparkSubmitParameters() {
        return software.amazon.jsii.Kernel.get(this, "sparkSubmitParameters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSparkSubmitParameters(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sparkSubmitParameters", java.util.Objects.requireNonNull(value, "sparkSubmitParameters is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
