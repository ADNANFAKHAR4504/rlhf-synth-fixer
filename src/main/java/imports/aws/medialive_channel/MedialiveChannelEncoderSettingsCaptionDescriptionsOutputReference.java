package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.868Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptionsOutputReference")
public class MedialiveChannelEncoderSettingsCaptionDescriptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsCaptionDescriptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsCaptionDescriptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveChannelEncoderSettingsCaptionDescriptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessibility() {
        software.amazon.jsii.Kernel.call(this, "resetAccessibility", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLanguageCode() {
        software.amazon.jsii.Kernel.call(this, "resetLanguageCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLanguageDescription() {
        software.amazon.jsii.Kernel.call(this, "resetLanguageDescription", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsOutputReference getDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "destinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessibilityInput() {
        return software.amazon.jsii.Kernel.get(this, "accessibilityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCaptionSelectorNameInput() {
        return software.amazon.jsii.Kernel.get(this, "captionSelectorNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings getDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "languageCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "languageDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessibility() {
        return software.amazon.jsii.Kernel.get(this, "accessibility", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessibility(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessibility", java.util.Objects.requireNonNull(value, "accessibility is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCaptionSelectorName() {
        return software.amazon.jsii.Kernel.get(this, "captionSelectorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCaptionSelectorName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "captionSelectorName", java.util.Objects.requireNonNull(value, "captionSelectorName is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
