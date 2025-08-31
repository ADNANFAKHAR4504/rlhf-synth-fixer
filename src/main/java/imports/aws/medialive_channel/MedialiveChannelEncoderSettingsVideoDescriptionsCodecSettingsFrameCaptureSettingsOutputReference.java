package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettingsOutputReference")
public class MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCaptureInterval() {
        software.amazon.jsii.Kernel.call(this, "resetCaptureInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptureIntervalUnits() {
        software.amazon.jsii.Kernel.call(this, "resetCaptureIntervalUnits", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCaptureIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "captureIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCaptureIntervalUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "captureIntervalUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCaptureInterval() {
        return software.amazon.jsii.Kernel.get(this, "captureInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCaptureInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "captureInterval", java.util.Objects.requireNonNull(value, "captureInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCaptureIntervalUnits() {
        return software.amazon.jsii.Kernel.get(this, "captureIntervalUnits", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCaptureIntervalUnits(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "captureIntervalUnits", java.util.Objects.requireNonNull(value, "captureIntervalUnits is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
