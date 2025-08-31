package imports.aws.config_configuration_recorder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.375Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingModeOutputReference")
public class ConfigConfigurationRecorderRecordingModeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigConfigurationRecorderRecordingModeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigConfigurationRecorderRecordingModeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigConfigurationRecorderRecordingModeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRecordingModeOverride(final @org.jetbrains.annotations.NotNull imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride value) {
        software.amazon.jsii.Kernel.call(this, "putRecordingModeOverride", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRecordingFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetRecordingFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordingModeOverride() {
        software.amazon.jsii.Kernel.call(this, "resetRecordingModeOverride", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverrideOutputReference getRecordingModeOverride() {
        return software.amazon.jsii.Kernel.get(this, "recordingModeOverride", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverrideOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordingFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "recordingFrequencyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride getRecordingModeOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "recordingModeOverrideInput", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordingFrequency() {
        return software.amazon.jsii.Kernel.get(this, "recordingFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordingFrequency(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordingFrequency", java.util.Objects.requireNonNull(value, "recordingFrequency is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingMode getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingMode.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingMode value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
