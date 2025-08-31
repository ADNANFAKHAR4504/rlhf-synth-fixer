package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelectionOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelectionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelectionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelectionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelectionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPidInput() {
        return software.amazon.jsii.Kernel.get(this, "pidInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPid() {
        return software.amazon.jsii.Kernel.get(this, "pid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPid(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "pid", java.util.Objects.requireNonNull(value, "pid is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
