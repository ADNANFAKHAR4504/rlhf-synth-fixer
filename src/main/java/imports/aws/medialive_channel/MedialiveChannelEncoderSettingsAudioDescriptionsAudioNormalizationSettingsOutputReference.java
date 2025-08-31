package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.864Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettingsOutputReference")
public class MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAlgorithm() {
        software.amazon.jsii.Kernel.call(this, "resetAlgorithm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAlgorithmControl() {
        software.amazon.jsii.Kernel.call(this, "resetAlgorithmControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetLkfs() {
        software.amazon.jsii.Kernel.call(this, "resetTargetLkfs", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlgorithmControlInput() {
        return software.amazon.jsii.Kernel.get(this, "algorithmControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "algorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetLkfsInput() {
        return software.amazon.jsii.Kernel.get(this, "targetLkfsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "algorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "algorithm", java.util.Objects.requireNonNull(value, "algorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlgorithmControl() {
        return software.amazon.jsii.Kernel.get(this, "algorithmControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlgorithmControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "algorithmControl", java.util.Objects.requireNonNull(value, "algorithmControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetLkfs() {
        return software.amazon.jsii.Kernel.get(this, "targetLkfs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetLkfs(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetLkfs", java.util.Objects.requireNonNull(value, "targetLkfs is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
