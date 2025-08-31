package imports.aws.config_remediation_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.379Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configRemediationConfiguration.ConfigRemediationConfigurationExecutionControlsOutputReference")
public class ConfigRemediationConfigurationExecutionControlsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigRemediationConfigurationExecutionControlsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigRemediationConfigurationExecutionControlsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigRemediationConfigurationExecutionControlsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSsmControls(final @org.jetbrains.annotations.NotNull imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControlsSsmControls value) {
        software.amazon.jsii.Kernel.call(this, "putSsmControls", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSsmControls() {
        software.amazon.jsii.Kernel.call(this, "resetSsmControls", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControlsSsmControlsOutputReference getSsmControls() {
        return software.amazon.jsii.Kernel.get(this, "ssmControls", software.amazon.jsii.NativeType.forClass(imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControlsSsmControlsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControlsSsmControls getSsmControlsInput() {
        return software.amazon.jsii.Kernel.get(this, "ssmControlsInput", software.amazon.jsii.NativeType.forClass(imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControlsSsmControls.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
