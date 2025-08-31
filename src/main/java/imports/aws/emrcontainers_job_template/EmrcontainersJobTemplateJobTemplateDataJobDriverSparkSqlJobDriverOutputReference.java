package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriverOutputReference")
public class EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriverOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriverOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriverOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriverOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEntryPoint() {
        software.amazon.jsii.Kernel.call(this, "resetEntryPoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSparkSqlParameters() {
        software.amazon.jsii.Kernel.call(this, "resetSparkSqlParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEntryPointInput() {
        return software.amazon.jsii.Kernel.get(this, "entryPointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSparkSqlParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "sparkSqlParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEntryPoint() {
        return software.amazon.jsii.Kernel.get(this, "entryPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEntryPoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "entryPoint", java.util.Objects.requireNonNull(value, "entryPoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSparkSqlParameters() {
        return software.amazon.jsii.Kernel.get(this, "sparkSqlParameters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSparkSqlParameters(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sparkSqlParameters", java.util.Objects.requireNonNull(value, "sparkSqlParameters is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
