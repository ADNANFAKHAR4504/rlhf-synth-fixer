package imports.aws.elastictranscoder_preset;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.189Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPreset.ElastictranscoderPresetVideoOutputReference")
public class ElastictranscoderPresetVideoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElastictranscoderPresetVideoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElastictranscoderPresetVideoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElastictranscoderPresetVideoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAspectRatio() {
        software.amazon.jsii.Kernel.call(this, "resetAspectRatio", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBitRate() {
        software.amazon.jsii.Kernel.call(this, "resetBitRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodec() {
        software.amazon.jsii.Kernel.call(this, "resetCodec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisplayAspectRatio() {
        software.amazon.jsii.Kernel.call(this, "resetDisplayAspectRatio", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFixedGop() {
        software.amazon.jsii.Kernel.call(this, "resetFixedGop", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFrameRate() {
        software.amazon.jsii.Kernel.call(this, "resetFrameRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyframesMaxDist() {
        software.amazon.jsii.Kernel.call(this, "resetKeyframesMaxDist", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxFrameRate() {
        software.amazon.jsii.Kernel.call(this, "resetMaxFrameRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxHeight() {
        software.amazon.jsii.Kernel.call(this, "resetMaxHeight", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxWidth() {
        software.amazon.jsii.Kernel.call(this, "resetMaxWidth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPaddingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetPaddingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResolution() {
        software.amazon.jsii.Kernel.call(this, "resetResolution", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSizingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetSizingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAspectRatioInput() {
        return software.amazon.jsii.Kernel.get(this, "aspectRatioInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBitRateInput() {
        return software.amazon.jsii.Kernel.get(this, "bitRateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodecInput() {
        return software.amazon.jsii.Kernel.get(this, "codecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDisplayAspectRatioInput() {
        return software.amazon.jsii.Kernel.get(this, "displayAspectRatioInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFixedGopInput() {
        return software.amazon.jsii.Kernel.get(this, "fixedGopInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFrameRateInput() {
        return software.amazon.jsii.Kernel.get(this, "frameRateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyframesMaxDistInput() {
        return software.amazon.jsii.Kernel.get(this, "keyframesMaxDistInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxFrameRateInput() {
        return software.amazon.jsii.Kernel.get(this, "maxFrameRateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxHeightInput() {
        return software.amazon.jsii.Kernel.get(this, "maxHeightInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxWidthInput() {
        return software.amazon.jsii.Kernel.get(this, "maxWidthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPaddingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "paddingPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResolutionInput() {
        return software.amazon.jsii.Kernel.get(this, "resolutionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSizingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "sizingPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAspectRatio() {
        return software.amazon.jsii.Kernel.get(this, "aspectRatio", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAspectRatio(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "aspectRatio", java.util.Objects.requireNonNull(value, "aspectRatio is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBitRate() {
        return software.amazon.jsii.Kernel.get(this, "bitRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBitRate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bitRate", java.util.Objects.requireNonNull(value, "bitRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodec() {
        return software.amazon.jsii.Kernel.get(this, "codec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCodec(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "codec", java.util.Objects.requireNonNull(value, "codec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayAspectRatio() {
        return software.amazon.jsii.Kernel.get(this, "displayAspectRatio", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDisplayAspectRatio(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "displayAspectRatio", java.util.Objects.requireNonNull(value, "displayAspectRatio is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFixedGop() {
        return software.amazon.jsii.Kernel.get(this, "fixedGop", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFixedGop(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fixedGop", java.util.Objects.requireNonNull(value, "fixedGop is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFrameRate() {
        return software.amazon.jsii.Kernel.get(this, "frameRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFrameRate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "frameRate", java.util.Objects.requireNonNull(value, "frameRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyframesMaxDist() {
        return software.amazon.jsii.Kernel.get(this, "keyframesMaxDist", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyframesMaxDist(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyframesMaxDist", java.util.Objects.requireNonNull(value, "keyframesMaxDist is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxFrameRate() {
        return software.amazon.jsii.Kernel.get(this, "maxFrameRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxFrameRate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxFrameRate", java.util.Objects.requireNonNull(value, "maxFrameRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxHeight() {
        return software.amazon.jsii.Kernel.get(this, "maxHeight", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxHeight(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxHeight", java.util.Objects.requireNonNull(value, "maxHeight is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxWidth() {
        return software.amazon.jsii.Kernel.get(this, "maxWidth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxWidth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxWidth", java.util.Objects.requireNonNull(value, "maxWidth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPaddingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "paddingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPaddingPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "paddingPolicy", java.util.Objects.requireNonNull(value, "paddingPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResolution() {
        return software.amazon.jsii.Kernel.get(this, "resolution", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResolution(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resolution", java.util.Objects.requireNonNull(value, "resolution is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSizingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "sizingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSizingPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sizingPolicy", java.util.Objects.requireNonNull(value, "sizingPolicy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
