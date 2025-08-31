package imports.aws.elastictranscoder_preset;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.189Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPreset.ElastictranscoderPresetThumbnailsOutputReference")
public class ElastictranscoderPresetThumbnailsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElastictranscoderPresetThumbnailsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElastictranscoderPresetThumbnailsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElastictranscoderPresetThumbnailsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAspectRatio() {
        software.amazon.jsii.Kernel.call(this, "resetAspectRatio", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFormat() {
        software.amazon.jsii.Kernel.call(this, "resetFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInterval() {
        software.amazon.jsii.Kernel.call(this, "resetInterval", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "formatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "intervalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getFormat() {
        return software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "format", java.util.Objects.requireNonNull(value, "format is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInterval() {
        return software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInterval(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "interval", java.util.Objects.requireNonNull(value, "interval is required"));
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

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
