package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.868Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettingsOutputReference")
public class MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCopyrightHolder() {
        software.amazon.jsii.Kernel.call(this, "resetCopyrightHolder", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFillLineGap() {
        software.amazon.jsii.Kernel.call(this, "resetFillLineGap", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFontFamily() {
        software.amazon.jsii.Kernel.call(this, "resetFontFamily", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStyleControl() {
        software.amazon.jsii.Kernel.call(this, "resetStyleControl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCopyrightHolderInput() {
        return software.amazon.jsii.Kernel.get(this, "copyrightHolderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFillLineGapInput() {
        return software.amazon.jsii.Kernel.get(this, "fillLineGapInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFontFamilyInput() {
        return software.amazon.jsii.Kernel.get(this, "fontFamilyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStyleControlInput() {
        return software.amazon.jsii.Kernel.get(this, "styleControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCopyrightHolder() {
        return software.amazon.jsii.Kernel.get(this, "copyrightHolder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCopyrightHolder(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "copyrightHolder", java.util.Objects.requireNonNull(value, "copyrightHolder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFillLineGap() {
        return software.amazon.jsii.Kernel.get(this, "fillLineGap", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFillLineGap(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fillLineGap", java.util.Objects.requireNonNull(value, "fillLineGap is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFontFamily() {
        return software.amazon.jsii.Kernel.get(this, "fontFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFontFamily(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fontFamily", java.util.Objects.requireNonNull(value, "fontFamily is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStyleControl() {
        return software.amazon.jsii.Kernel.get(this, "styleControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStyleControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "styleControl", java.util.Objects.requireNonNull(value, "styleControl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
