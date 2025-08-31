package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.873Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCaptionChannelInput() {
        return software.amazon.jsii.Kernel.get(this, "captionChannelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "languageCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "languageDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCaptionChannel() {
        return software.amazon.jsii.Kernel.get(this, "captionChannel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCaptionChannel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "captionChannel", java.util.Objects.requireNonNull(value, "captionChannel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLanguageCode() {
        return software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLanguageCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "languageCode", java.util.Objects.requireNonNull(value, "languageCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLanguageDescription() {
        return software.amazon.jsii.Kernel.get(this, "languageDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLanguageDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "languageDescription", java.util.Objects.requireNonNull(value, "languageDescription is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
