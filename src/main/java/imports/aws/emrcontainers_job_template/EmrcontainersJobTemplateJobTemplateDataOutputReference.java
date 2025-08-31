package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataOutputReference")
public class EmrcontainersJobTemplateJobTemplateDataOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrcontainersJobTemplateJobTemplateDataOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrcontainersJobTemplateJobTemplateDataOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrcontainersJobTemplateJobTemplateDataOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putConfigurationOverrides(final @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides value) {
        software.amazon.jsii.Kernel.call(this, "putConfigurationOverrides", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJobDriver(final @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver value) {
        software.amazon.jsii.Kernel.call(this, "putJobDriver", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConfigurationOverrides() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurationOverrides", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJobTags() {
        software.amazon.jsii.Kernel.call(this, "resetJobTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesOutputReference getConfigurationOverrides() {
        return software.amazon.jsii.Kernel.get(this, "configurationOverrides", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverOutputReference getJobDriver() {
        return software.amazon.jsii.Kernel.get(this, "jobDriver", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides getConfigurationOverridesInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationOverridesInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver getJobDriverInput() {
        return software.amazon.jsii.Kernel.get(this, "jobDriverInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getJobTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "jobTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReleaseLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRoleArn", java.util.Objects.requireNonNull(value, "executionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getJobTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "jobTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setJobTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "jobTags", java.util.Objects.requireNonNull(value, "jobTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReleaseLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "releaseLabel", java.util.Objects.requireNonNull(value, "releaseLabel is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateData getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateData.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateData value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
