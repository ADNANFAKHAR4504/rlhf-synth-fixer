package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriverOutputReference")
public class EmrcontainersJobTemplateJobTemplateDataJobDriverOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrcontainersJobTemplateJobTemplateDataJobDriverOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrcontainersJobTemplateJobTemplateDataJobDriverOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrcontainersJobTemplateJobTemplateDataJobDriverOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSparkSqlJobDriver(final @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver value) {
        software.amazon.jsii.Kernel.call(this, "putSparkSqlJobDriver", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSparkSubmitJobDriver(final @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver value) {
        software.amazon.jsii.Kernel.call(this, "putSparkSubmitJobDriver", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSparkSqlJobDriver() {
        software.amazon.jsii.Kernel.call(this, "resetSparkSqlJobDriver", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSparkSubmitJobDriver() {
        software.amazon.jsii.Kernel.call(this, "resetSparkSubmitJobDriver", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriverOutputReference getSparkSqlJobDriver() {
        return software.amazon.jsii.Kernel.get(this, "sparkSqlJobDriver", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriverOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriverOutputReference getSparkSubmitJobDriver() {
        return software.amazon.jsii.Kernel.get(this, "sparkSubmitJobDriver", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriverOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver getSparkSqlJobDriverInput() {
        return software.amazon.jsii.Kernel.get(this, "sparkSqlJobDriverInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver getSparkSubmitJobDriverInput() {
        return software.amazon.jsii.Kernel.get(this, "sparkSubmitJobDriverInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
