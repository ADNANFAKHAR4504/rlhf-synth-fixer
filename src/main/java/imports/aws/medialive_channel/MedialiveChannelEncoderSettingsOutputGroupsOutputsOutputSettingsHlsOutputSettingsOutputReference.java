package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.878Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHlsSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings value) {
        software.amazon.jsii.Kernel.call(this, "putHlsSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetH265PackagingType() {
        software.amazon.jsii.Kernel.call(this, "resetH265PackagingType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNameModifier() {
        software.amazon.jsii.Kernel.call(this, "resetNameModifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentModifier() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentModifier", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsOutputReference getHlsSettings() {
        return software.amazon.jsii.Kernel.get(this, "hlsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getH265PackagingTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "h265PackagingTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings getHlsSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameModifierInput() {
        return software.amazon.jsii.Kernel.get(this, "nameModifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSegmentModifierInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentModifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getH265PackagingType() {
        return software.amazon.jsii.Kernel.get(this, "h265PackagingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setH265PackagingType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "h265PackagingType", java.util.Objects.requireNonNull(value, "h265PackagingType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNameModifier() {
        return software.amazon.jsii.Kernel.get(this, "nameModifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNameModifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nameModifier", java.util.Objects.requireNonNull(value, "nameModifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSegmentModifier() {
        return software.amazon.jsii.Kernel.get(this, "segmentModifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSegmentModifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "segmentModifier", java.util.Objects.requireNonNull(value, "segmentModifier is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
