package imports.aws.config_remediation_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.380Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configRemediationConfiguration.ConfigRemediationConfigurationExecutionControlsSsmControlsOutputReference")
public class ConfigRemediationConfigurationExecutionControlsSsmControlsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigRemediationConfigurationExecutionControlsSsmControlsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigRemediationConfigurationExecutionControlsSsmControlsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigRemediationConfigurationExecutionControlsSsmControlsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConcurrentExecutionRatePercentage() {
        software.amazon.jsii.Kernel.call(this, "resetConcurrentExecutionRatePercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetErrorPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetErrorPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConcurrentExecutionRatePercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "concurrentExecutionRatePercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getErrorPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "errorPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConcurrentExecutionRatePercentage() {
        return software.amazon.jsii.Kernel.get(this, "concurrentExecutionRatePercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConcurrentExecutionRatePercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "concurrentExecutionRatePercentage", java.util.Objects.requireNonNull(value, "concurrentExecutionRatePercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getErrorPercentage() {
        return software.amazon.jsii.Kernel.get(this, "errorPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setErrorPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "errorPercentage", java.util.Objects.requireNonNull(value, "errorPercentage is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControlsSsmControls getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControlsSsmControls.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControlsSsmControls value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
