package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationOutputReference")
public class MedialiveChannelEncoderSettingsMotionGraphicsConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsMotionGraphicsConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsMotionGraphicsConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsMotionGraphicsConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMotionGraphicsSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings value) {
        software.amazon.jsii.Kernel.call(this, "putMotionGraphicsSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMotionGraphicsInsertion() {
        software.amazon.jsii.Kernel.call(this, "resetMotionGraphicsInsertion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettingsOutputReference getMotionGraphicsSettings() {
        return software.amazon.jsii.Kernel.get(this, "motionGraphicsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMotionGraphicsInsertionInput() {
        return software.amazon.jsii.Kernel.get(this, "motionGraphicsInsertionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings getMotionGraphicsSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "motionGraphicsSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMotionGraphicsInsertion() {
        return software.amazon.jsii.Kernel.get(this, "motionGraphicsInsertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMotionGraphicsInsertion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "motionGraphicsInsertion", java.util.Objects.requireNonNull(value, "motionGraphicsInsertion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
