package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettingsOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOcrLanguage() {
        software.amazon.jsii.Kernel.call(this, "resetOcrLanguage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPid() {
        software.amazon.jsii.Kernel.call(this, "resetPid", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOcrLanguageInput() {
        return software.amazon.jsii.Kernel.get(this, "ocrLanguageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPidInput() {
        return software.amazon.jsii.Kernel.get(this, "pidInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOcrLanguage() {
        return software.amazon.jsii.Kernel.get(this, "ocrLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOcrLanguage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ocrLanguage", java.util.Objects.requireNonNull(value, "ocrLanguage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPid() {
        return software.amazon.jsii.Kernel.get(this, "pid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPid(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "pid", java.util.Objects.requireNonNull(value, "pid is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
