package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettingsOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSourceAncillaryChannelNumber() {
        software.amazon.jsii.Kernel.call(this, "resetSourceAncillaryChannelNumber", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSourceAncillaryChannelNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceAncillaryChannelNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSourceAncillaryChannelNumber() {
        return software.amazon.jsii.Kernel.get(this, "sourceAncillaryChannelNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSourceAncillaryChannelNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sourceAncillaryChannelNumber", java.util.Objects.requireNonNull(value, "sourceAncillaryChannelNumber is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
