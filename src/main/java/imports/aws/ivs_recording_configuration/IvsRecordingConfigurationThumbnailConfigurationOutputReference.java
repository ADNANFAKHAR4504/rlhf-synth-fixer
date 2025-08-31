package imports.aws.ivs_recording_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.425Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivsRecordingConfiguration.IvsRecordingConfigurationThumbnailConfigurationOutputReference")
public class IvsRecordingConfigurationThumbnailConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IvsRecordingConfigurationThumbnailConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IvsRecordingConfigurationThumbnailConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IvsRecordingConfigurationThumbnailConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRecordingMode() {
        software.amazon.jsii.Kernel.call(this, "resetRecordingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetIntervalSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTargetIntervalSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "recordingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetIntervalSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "targetIntervalSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordingMode() {
        return software.amazon.jsii.Kernel.get(this, "recordingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordingMode", java.util.Objects.requireNonNull(value, "recordingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetIntervalSeconds() {
        return software.amazon.jsii.Kernel.get(this, "targetIntervalSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetIntervalSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetIntervalSeconds", java.util.Objects.requireNonNull(value, "targetIntervalSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
