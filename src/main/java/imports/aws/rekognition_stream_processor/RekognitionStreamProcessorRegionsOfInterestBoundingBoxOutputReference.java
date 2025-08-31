package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference")
public class RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHeight() {
        software.amazon.jsii.Kernel.call(this, "resetHeight", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLeft() {
        software.amazon.jsii.Kernel.call(this, "resetLeft", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTop() {
        software.amazon.jsii.Kernel.call(this, "resetTop", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWidth() {
        software.amazon.jsii.Kernel.call(this, "resetWidth", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHeightInput() {
        return software.amazon.jsii.Kernel.get(this, "heightInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLeftInput() {
        return software.amazon.jsii.Kernel.get(this, "leftInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTopInput() {
        return software.amazon.jsii.Kernel.get(this, "topInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getLeft() {
        return software.amazon.jsii.Kernel.get(this, "left", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLeft(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "left", java.util.Objects.requireNonNull(value, "left is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTop() {
        return software.amazon.jsii.Kernel.get(this, "top", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTop(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "top", java.util.Objects.requireNonNull(value, "top is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWidth() {
        return software.amazon.jsii.Kernel.get(this, "width", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWidth(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "width", java.util.Objects.requireNonNull(value, "width is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBox value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
