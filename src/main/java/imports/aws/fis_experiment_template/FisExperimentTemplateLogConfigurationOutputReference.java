package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateLogConfigurationOutputReference")
public class FisExperimentTemplateLogConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FisExperimentTemplateLogConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FisExperimentTemplateLogConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FisExperimentTemplateLogConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogsConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogsConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Configuration(final @org.jetbrains.annotations.NotNull imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration value) {
        software.amazon.jsii.Kernel.call(this, "putS3Configuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogsConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogsConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Configuration() {
        software.amazon.jsii.Kernel.call(this, "resetS3Configuration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfigurationOutputReference getCloudwatchLogsConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3ConfigurationOutputReference getS3Configuration() {
        return software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3ConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration getCloudwatchLogsConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLogSchemaVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "logSchemaVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration getS3ConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLogSchemaVersion() {
        return software.amazon.jsii.Kernel.get(this, "logSchemaVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLogSchemaVersion(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "logSchemaVersion", java.util.Objects.requireNonNull(value, "logSchemaVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
