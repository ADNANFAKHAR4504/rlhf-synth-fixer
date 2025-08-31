package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.876Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAudioDescriptionNames() {
        software.amazon.jsii.Kernel.call(this, "resetAudioDescriptionNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptionDescriptionNames() {
        software.amazon.jsii.Kernel.call(this, "resetCaptionDescriptionNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputName() {
        software.amazon.jsii.Kernel.call(this, "resetOutputName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideoDescriptionName() {
        software.amazon.jsii.Kernel.call(this, "resetVideoDescriptionName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsOutputReference getOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "outputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAudioDescriptionNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "audioDescriptionNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCaptionDescriptionNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "captionDescriptionNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputNameInput() {
        return software.amazon.jsii.Kernel.get(this, "outputNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings getOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "outputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVideoDescriptionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "videoDescriptionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAudioDescriptionNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "audioDescriptionNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAudioDescriptionNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "audioDescriptionNames", java.util.Objects.requireNonNull(value, "audioDescriptionNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCaptionDescriptionNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "captionDescriptionNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCaptionDescriptionNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "captionDescriptionNames", java.util.Objects.requireNonNull(value, "captionDescriptionNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputName() {
        return software.amazon.jsii.Kernel.get(this, "outputName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputName", java.util.Objects.requireNonNull(value, "outputName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVideoDescriptionName() {
        return software.amazon.jsii.Kernel.get(this, "videoDescriptionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVideoDescriptionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "videoDescriptionName", java.util.Objects.requireNonNull(value, "videoDescriptionName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputs value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
