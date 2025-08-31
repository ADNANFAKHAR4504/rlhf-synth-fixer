package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.877Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAudioRenditionSets() {
        software.amazon.jsii.Kernel.call(this, "resetAudioRenditionSets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNielsenId3Behavior() {
        software.amazon.jsii.Kernel.call(this, "resetNielsenId3Behavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimedMetadataBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetTimedMetadataBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioRenditionSetsInput() {
        return software.amazon.jsii.Kernel.get(this, "audioRenditionSetsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNielsenId3BehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "nielsenId3BehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioRenditionSets() {
        return software.amazon.jsii.Kernel.get(this, "audioRenditionSets", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioRenditionSets(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioRenditionSets", java.util.Objects.requireNonNull(value, "audioRenditionSets is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNielsenId3Behavior() {
        return software.amazon.jsii.Kernel.get(this, "nielsenId3Behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNielsenId3Behavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nielsenId3Behavior", java.util.Objects.requireNonNull(value, "nielsenId3Behavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimedMetadataBehavior() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimedMetadataBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timedMetadataBehavior", java.util.Objects.requireNonNull(value, "timedMetadataBehavior is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
