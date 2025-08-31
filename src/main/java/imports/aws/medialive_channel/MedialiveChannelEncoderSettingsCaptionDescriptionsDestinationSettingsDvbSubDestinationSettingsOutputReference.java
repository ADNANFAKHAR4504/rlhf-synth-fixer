package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.868Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsOutputReference")
public class MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putFont(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsFont value) {
        software.amazon.jsii.Kernel.call(this, "putFont", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAlignment() {
        software.amazon.jsii.Kernel.call(this, "resetAlignment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBackgroundColor() {
        software.amazon.jsii.Kernel.call(this, "resetBackgroundColor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBackgroundOpacity() {
        software.amazon.jsii.Kernel.call(this, "resetBackgroundOpacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFont() {
        software.amazon.jsii.Kernel.call(this, "resetFont", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFontColor() {
        software.amazon.jsii.Kernel.call(this, "resetFontColor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFontOpacity() {
        software.amazon.jsii.Kernel.call(this, "resetFontOpacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFontResolution() {
        software.amazon.jsii.Kernel.call(this, "resetFontResolution", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFontSize() {
        software.amazon.jsii.Kernel.call(this, "resetFontSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutlineColor() {
        software.amazon.jsii.Kernel.call(this, "resetOutlineColor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutlineSize() {
        software.amazon.jsii.Kernel.call(this, "resetOutlineSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShadowColor() {
        software.amazon.jsii.Kernel.call(this, "resetShadowColor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShadowOpacity() {
        software.amazon.jsii.Kernel.call(this, "resetShadowOpacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShadowXOffset() {
        software.amazon.jsii.Kernel.call(this, "resetShadowXOffset", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShadowYOffset() {
        software.amazon.jsii.Kernel.call(this, "resetShadowYOffset", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTeletextGridControl() {
        software.amazon.jsii.Kernel.call(this, "resetTeletextGridControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXPosition() {
        software.amazon.jsii.Kernel.call(this, "resetXPosition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetYPosition() {
        software.amazon.jsii.Kernel.call(this, "resetYPosition", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsFontOutputReference getFont() {
        return software.amazon.jsii.Kernel.get(this, "font", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsFontOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlignmentInput() {
        return software.amazon.jsii.Kernel.get(this, "alignmentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBackgroundColorInput() {
        return software.amazon.jsii.Kernel.get(this, "backgroundColorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBackgroundOpacityInput() {
        return software.amazon.jsii.Kernel.get(this, "backgroundOpacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFontColorInput() {
        return software.amazon.jsii.Kernel.get(this, "fontColorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsFont getFontInput() {
        return software.amazon.jsii.Kernel.get(this, "fontInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsFont.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFontOpacityInput() {
        return software.amazon.jsii.Kernel.get(this, "fontOpacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFontResolutionInput() {
        return software.amazon.jsii.Kernel.get(this, "fontResolutionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFontSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "fontSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutlineColorInput() {
        return software.amazon.jsii.Kernel.get(this, "outlineColorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOutlineSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "outlineSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getShadowColorInput() {
        return software.amazon.jsii.Kernel.get(this, "shadowColorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getShadowOpacityInput() {
        return software.amazon.jsii.Kernel.get(this, "shadowOpacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getShadowXOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "shadowXOffsetInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getShadowYOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "shadowYOffsetInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTeletextGridControlInput() {
        return software.amazon.jsii.Kernel.get(this, "teletextGridControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getXPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "xPositionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getYPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "yPositionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlignment() {
        return software.amazon.jsii.Kernel.get(this, "alignment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlignment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alignment", java.util.Objects.requireNonNull(value, "alignment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBackgroundColor() {
        return software.amazon.jsii.Kernel.get(this, "backgroundColor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBackgroundColor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "backgroundColor", java.util.Objects.requireNonNull(value, "backgroundColor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBackgroundOpacity() {
        return software.amazon.jsii.Kernel.get(this, "backgroundOpacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBackgroundOpacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "backgroundOpacity", java.util.Objects.requireNonNull(value, "backgroundOpacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFontColor() {
        return software.amazon.jsii.Kernel.get(this, "fontColor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFontColor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fontColor", java.util.Objects.requireNonNull(value, "fontColor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFontOpacity() {
        return software.amazon.jsii.Kernel.get(this, "fontOpacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFontOpacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fontOpacity", java.util.Objects.requireNonNull(value, "fontOpacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFontResolution() {
        return software.amazon.jsii.Kernel.get(this, "fontResolution", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFontResolution(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fontResolution", java.util.Objects.requireNonNull(value, "fontResolution is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFontSize() {
        return software.amazon.jsii.Kernel.get(this, "fontSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFontSize(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fontSize", java.util.Objects.requireNonNull(value, "fontSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutlineColor() {
        return software.amazon.jsii.Kernel.get(this, "outlineColor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutlineColor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outlineColor", java.util.Objects.requireNonNull(value, "outlineColor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOutlineSize() {
        return software.amazon.jsii.Kernel.get(this, "outlineSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOutlineSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "outlineSize", java.util.Objects.requireNonNull(value, "outlineSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getShadowColor() {
        return software.amazon.jsii.Kernel.get(this, "shadowColor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setShadowColor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "shadowColor", java.util.Objects.requireNonNull(value, "shadowColor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getShadowOpacity() {
        return software.amazon.jsii.Kernel.get(this, "shadowOpacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setShadowOpacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "shadowOpacity", java.util.Objects.requireNonNull(value, "shadowOpacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getShadowXOffset() {
        return software.amazon.jsii.Kernel.get(this, "shadowXOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setShadowXOffset(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "shadowXOffset", java.util.Objects.requireNonNull(value, "shadowXOffset is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getShadowYOffset() {
        return software.amazon.jsii.Kernel.get(this, "shadowYOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setShadowYOffset(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "shadowYOffset", java.util.Objects.requireNonNull(value, "shadowYOffset is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTeletextGridControl() {
        return software.amazon.jsii.Kernel.get(this, "teletextGridControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTeletextGridControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "teletextGridControl", java.util.Objects.requireNonNull(value, "teletextGridControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getXPosition() {
        return software.amazon.jsii.Kernel.get(this, "xPosition", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setXPosition(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "xPosition", java.util.Objects.requireNonNull(value, "xPosition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getYPosition() {
        return software.amazon.jsii.Kernel.get(this, "yPosition", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setYPosition(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "yPosition", java.util.Objects.requireNonNull(value, "yPosition is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
