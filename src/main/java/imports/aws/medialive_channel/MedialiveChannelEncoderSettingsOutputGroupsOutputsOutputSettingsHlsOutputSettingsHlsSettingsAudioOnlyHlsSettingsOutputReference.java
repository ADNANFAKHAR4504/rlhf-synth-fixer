package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.877Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAudioOnlyImage(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage value) {
        software.amazon.jsii.Kernel.call(this, "putAudioOnlyImage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAudioGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetAudioGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioOnlyImage() {
        software.amazon.jsii.Kernel.call(this, "resetAudioOnlyImage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioTrackType() {
        software.amazon.jsii.Kernel.call(this, "resetAudioTrackType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentType() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImageOutputReference getAudioOnlyImage() {
        return software.amazon.jsii.Kernel.get(this, "audioOnlyImage", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImageOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "audioGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage getAudioOnlyImageInput() {
        return software.amazon.jsii.Kernel.get(this, "audioOnlyImageInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioTrackTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "audioTrackTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSegmentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioGroupId() {
        return software.amazon.jsii.Kernel.get(this, "audioGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioGroupId", java.util.Objects.requireNonNull(value, "audioGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioTrackType() {
        return software.amazon.jsii.Kernel.get(this, "audioTrackType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioTrackType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioTrackType", java.util.Objects.requireNonNull(value, "audioTrackType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSegmentType() {
        return software.amazon.jsii.Kernel.get(this, "segmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSegmentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "segmentType", java.util.Objects.requireNonNull(value, "segmentType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
