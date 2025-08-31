package imports.aws.elastictranscoder_preset;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.189Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPreset.ElastictranscoderPresetVideoWatermarksOutputReference")
public class ElastictranscoderPresetVideoWatermarksOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElastictranscoderPresetVideoWatermarksOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElastictranscoderPresetVideoWatermarksOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ElastictranscoderPresetVideoWatermarksOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetHorizontalAlign() {
        software.amazon.jsii.Kernel.call(this, "resetHorizontalAlign", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHorizontalOffset() {
        software.amazon.jsii.Kernel.call(this, "resetHorizontalOffset", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxHeight() {
        software.amazon.jsii.Kernel.call(this, "resetMaxHeight", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxWidth() {
        software.amazon.jsii.Kernel.call(this, "resetMaxWidth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpacity() {
        software.amazon.jsii.Kernel.call(this, "resetOpacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSizingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetSizingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTarget() {
        software.amazon.jsii.Kernel.call(this, "resetTarget", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerticalAlign() {
        software.amazon.jsii.Kernel.call(this, "resetVerticalAlign", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerticalOffset() {
        software.amazon.jsii.Kernel.call(this, "resetVerticalOffset", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHorizontalAlignInput() {
        return software.amazon.jsii.Kernel.get(this, "horizontalAlignInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHorizontalOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "horizontalOffsetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxHeightInput() {
        return software.amazon.jsii.Kernel.get(this, "maxHeightInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxWidthInput() {
        return software.amazon.jsii.Kernel.get(this, "maxWidthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOpacityInput() {
        return software.amazon.jsii.Kernel.get(this, "opacityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSizingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "sizingPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "targetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVerticalAlignInput() {
        return software.amazon.jsii.Kernel.get(this, "verticalAlignInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVerticalOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "verticalOffsetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHorizontalAlign() {
        return software.amazon.jsii.Kernel.get(this, "horizontalAlign", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHorizontalAlign(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "horizontalAlign", java.util.Objects.requireNonNull(value, "horizontalAlign is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHorizontalOffset() {
        return software.amazon.jsii.Kernel.get(this, "horizontalOffset", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHorizontalOffset(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "horizontalOffset", java.util.Objects.requireNonNull(value, "horizontalOffset is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getOpacity() {
        return software.amazon.jsii.Kernel.get(this, "opacity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOpacity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "opacity", java.util.Objects.requireNonNull(value, "opacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSizingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "sizingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSizingPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sizingPolicy", java.util.Objects.requireNonNull(value, "sizingPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTarget() {
        return software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTarget(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "target", java.util.Objects.requireNonNull(value, "target is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVerticalAlign() {
        return software.amazon.jsii.Kernel.get(this, "verticalAlign", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVerticalAlign(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "verticalAlign", java.util.Objects.requireNonNull(value, "verticalAlign is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVerticalOffset() {
        return software.amazon.jsii.Kernel.get(this, "verticalOffset", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVerticalOffset(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "verticalOffset", java.util.Objects.requireNonNull(value, "verticalOffset is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarks value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
