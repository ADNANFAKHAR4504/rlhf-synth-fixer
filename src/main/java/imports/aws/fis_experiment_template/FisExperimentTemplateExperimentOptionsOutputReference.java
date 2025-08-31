package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateExperimentOptionsOutputReference")
public class FisExperimentTemplateExperimentOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FisExperimentTemplateExperimentOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FisExperimentTemplateExperimentOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FisExperimentTemplateExperimentOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccountTargeting() {
        software.amazon.jsii.Kernel.call(this, "resetAccountTargeting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmptyTargetResolutionMode() {
        software.amazon.jsii.Kernel.call(this, "resetEmptyTargetResolutionMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountTargetingInput() {
        return software.amazon.jsii.Kernel.get(this, "accountTargetingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmptyTargetResolutionModeInput() {
        return software.amazon.jsii.Kernel.get(this, "emptyTargetResolutionModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountTargeting() {
        return software.amazon.jsii.Kernel.get(this, "accountTargeting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountTargeting(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountTargeting", java.util.Objects.requireNonNull(value, "accountTargeting is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmptyTargetResolutionMode() {
        return software.amazon.jsii.Kernel.get(this, "emptyTargetResolutionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmptyTargetResolutionMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emptyTargetResolutionMode", java.util.Objects.requireNonNull(value, "emptyTargetResolutionMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
