package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationOutputReference")
public class FisExperimentTemplateExperimentReportConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FisExperimentTemplateExperimentReportConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FisExperimentTemplateExperimentReportConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FisExperimentTemplateExperimentReportConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDataSources(final @org.jetbrains.annotations.NotNull imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources value) {
        software.amazon.jsii.Kernel.call(this, "putDataSources", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOutputs(final @org.jetbrains.annotations.NotNull imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs value) {
        software.amazon.jsii.Kernel.call(this, "putOutputs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataSources() {
        software.amazon.jsii.Kernel.call(this, "resetDataSources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputs() {
        software.amazon.jsii.Kernel.call(this, "resetOutputs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPostExperimentDuration() {
        software.amazon.jsii.Kernel.call(this, "resetPostExperimentDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreExperimentDuration() {
        software.amazon.jsii.Kernel.call(this, "resetPreExperimentDuration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSourcesOutputReference getDataSources() {
        return software.amazon.jsii.Kernel.get(this, "dataSources", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSourcesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputsOutputReference getOutputs() {
        return software.amazon.jsii.Kernel.get(this, "outputs", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources getDataSourcesInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourcesInput", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs getOutputsInput() {
        return software.amazon.jsii.Kernel.get(this, "outputsInput", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPostExperimentDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "postExperimentDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreExperimentDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "preExperimentDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostExperimentDuration() {
        return software.amazon.jsii.Kernel.get(this, "postExperimentDuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPostExperimentDuration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "postExperimentDuration", java.util.Objects.requireNonNull(value, "postExperimentDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreExperimentDuration() {
        return software.amazon.jsii.Kernel.get(this, "preExperimentDuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreExperimentDuration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preExperimentDuration", java.util.Objects.requireNonNull(value, "preExperimentDuration is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
