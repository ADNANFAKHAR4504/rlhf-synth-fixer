package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangleOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHeightInput() {
        return software.amazon.jsii.Kernel.get(this, "heightInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLeftOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "leftOffsetInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTopOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "topOffsetInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWidthInput() {
        return software.amazon.jsii.Kernel.get(this, "widthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHeight() {
        return software.amazon.jsii.Kernel.get(this, "height", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHeight(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "height", java.util.Objects.requireNonNull(value, "height is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLeftOffset() {
        return software.amazon.jsii.Kernel.get(this, "leftOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLeftOffset(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "leftOffset", java.util.Objects.requireNonNull(value, "leftOffset is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTopOffset() {
        return software.amazon.jsii.Kernel.get(this, "topOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTopOffset(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "topOffset", java.util.Objects.requireNonNull(value, "topOffset is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWidth() {
        return software.amazon.jsii.Kernel.get(this, "width", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWidth(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "width", java.util.Objects.requireNonNull(value, "width is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
