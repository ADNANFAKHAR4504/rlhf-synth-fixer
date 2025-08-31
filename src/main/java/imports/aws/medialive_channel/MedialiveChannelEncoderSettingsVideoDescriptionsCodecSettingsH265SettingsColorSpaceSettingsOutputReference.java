package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsOutputReference")
public class MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putColorSpacePassthroughSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings value) {
        software.amazon.jsii.Kernel.call(this, "putColorSpacePassthroughSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDolbyVision81Settings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings value) {
        software.amazon.jsii.Kernel.call(this, "putDolbyVision81Settings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHdr10Settings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings value) {
        software.amazon.jsii.Kernel.call(this, "putHdr10Settings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRec601Settings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings value) {
        software.amazon.jsii.Kernel.call(this, "putRec601Settings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRec709Settings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings value) {
        software.amazon.jsii.Kernel.call(this, "putRec709Settings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetColorSpacePassthroughSettings() {
        software.amazon.jsii.Kernel.call(this, "resetColorSpacePassthroughSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDolbyVision81Settings() {
        software.amazon.jsii.Kernel.call(this, "resetDolbyVision81Settings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHdr10Settings() {
        software.amazon.jsii.Kernel.call(this, "resetHdr10Settings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRec601Settings() {
        software.amazon.jsii.Kernel.call(this, "resetRec601Settings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRec709Settings() {
        software.amazon.jsii.Kernel.call(this, "resetRec709Settings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettingsOutputReference getColorSpacePassthroughSettings() {
        return software.amazon.jsii.Kernel.get(this, "colorSpacePassthroughSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81SettingsOutputReference getDolbyVision81Settings() {
        return software.amazon.jsii.Kernel.get(this, "dolbyVision81Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81SettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10SettingsOutputReference getHdr10Settings() {
        return software.amazon.jsii.Kernel.get(this, "hdr10Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10SettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601SettingsOutputReference getRec601Settings() {
        return software.amazon.jsii.Kernel.get(this, "rec601Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601SettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709SettingsOutputReference getRec709Settings() {
        return software.amazon.jsii.Kernel.get(this, "rec709Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709SettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings getColorSpacePassthroughSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "colorSpacePassthroughSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings getDolbyVision81SettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "dolbyVision81SettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings getHdr10SettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hdr10SettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings getRec601SettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "rec601SettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings getRec709SettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "rec709SettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
