package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettingsOutputReference")
public class MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimecodeBurninFontSize() {
        software.amazon.jsii.Kernel.call(this, "resetTimecodeBurninFontSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimecodeBurninPosition() {
        software.amazon.jsii.Kernel.call(this, "resetTimecodeBurninPosition", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimecodeBurninFontSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "timecodeBurninFontSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimecodeBurninPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "timecodeBurninPositionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "prefix", java.util.Objects.requireNonNull(value, "prefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimecodeBurninFontSize() {
        return software.amazon.jsii.Kernel.get(this, "timecodeBurninFontSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimecodeBurninFontSize(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timecodeBurninFontSize", java.util.Objects.requireNonNull(value, "timecodeBurninFontSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimecodeBurninPosition() {
        return software.amazon.jsii.Kernel.get(this, "timecodeBurninPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimecodeBurninPosition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timecodeBurninPosition", java.util.Objects.requireNonNull(value, "timecodeBurninPosition is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
