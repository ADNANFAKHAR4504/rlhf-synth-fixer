package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDolbyEDecode(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode value) {
        software.amazon.jsii.Kernel.call(this, "putDolbyEDecode", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTracks(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks> __cast_cd4240 = (java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTracks", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDolbyEDecode() {
        software.amazon.jsii.Kernel.call(this, "resetDolbyEDecode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecodeOutputReference getDolbyEDecode() {
        return software.amazon.jsii.Kernel.get(this, "dolbyEDecode", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecodeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracksList getTracks() {
        return software.amazon.jsii.Kernel.get(this, "tracks", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracksList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode getDolbyEDecodeInput() {
        return software.amazon.jsii.Kernel.get(this, "dolbyEDecodeInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTracksInput() {
        return software.amazon.jsii.Kernel.get(this, "tracksInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
