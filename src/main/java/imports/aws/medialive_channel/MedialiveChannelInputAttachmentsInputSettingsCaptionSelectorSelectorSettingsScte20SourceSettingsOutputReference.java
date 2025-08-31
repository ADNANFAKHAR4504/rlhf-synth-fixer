package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettingsOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConvert608To708() {
        software.amazon.jsii.Kernel.call(this, "resetConvert608To708", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSource608ChannelNumber() {
        software.amazon.jsii.Kernel.call(this, "resetSource608ChannelNumber", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConvert608To708Input() {
        return software.amazon.jsii.Kernel.get(this, "convert608To708Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSource608ChannelNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "source608ChannelNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConvert608To708() {
        return software.amazon.jsii.Kernel.get(this, "convert608To708", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConvert608To708(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "convert608To708", java.util.Objects.requireNonNull(value, "convert608To708 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSource608ChannelNumber() {
        return software.amazon.jsii.Kernel.get(this, "source608ChannelNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSource608ChannelNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "source608ChannelNumber", java.util.Objects.requireNonNull(value, "source608ChannelNumber is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
