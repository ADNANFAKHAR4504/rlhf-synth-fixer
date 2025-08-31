package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecodeOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecodeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecodeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecodeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecodeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProgramSelectionInput() {
        return software.amazon.jsii.Kernel.get(this, "programSelectionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProgramSelection() {
        return software.amazon.jsii.Kernel.get(this, "programSelection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProgramSelection(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "programSelection", java.util.Objects.requireNonNull(value, "programSelection is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
