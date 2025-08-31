package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsTemporalFilterSettingsOutputReference")
public class MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsTemporalFilterSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsTemporalFilterSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsTemporalFilterSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsTemporalFilterSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetPostFilterSharpening() {
        software.amazon.jsii.Kernel.call(this, "resetPostFilterSharpening", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStrength() {
        software.amazon.jsii.Kernel.call(this, "resetStrength", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPostFilterSharpeningInput() {
        return software.amazon.jsii.Kernel.get(this, "postFilterSharpeningInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStrengthInput() {
        return software.amazon.jsii.Kernel.get(this, "strengthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostFilterSharpening() {
        return software.amazon.jsii.Kernel.get(this, "postFilterSharpening", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPostFilterSharpening(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "postFilterSharpening", java.util.Objects.requireNonNull(value, "postFilterSharpening is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStrength() {
        return software.amazon.jsii.Kernel.get(this, "strength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStrength(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "strength", java.util.Objects.requireNonNull(value, "strength is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsTemporalFilterSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsTemporalFilterSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsTemporalFilterSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
