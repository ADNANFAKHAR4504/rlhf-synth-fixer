package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestOutputReference")
public class RekognitionStreamProcessorRegionsOfInterestOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RekognitionStreamProcessorRegionsOfInterestOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RekognitionStreamProcessorRegionsOfInterestOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public RekognitionStreamProcessorRegionsOfInterestOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putBoundingBox(final @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBox value) {
        software.amazon.jsii.Kernel.call(this, "putBoundingBox", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPolygon(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestPolygon>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestPolygon> __cast_cd4240 = (java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestPolygon>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestPolygon __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPolygon", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBoundingBox() {
        software.amazon.jsii.Kernel.call(this, "resetBoundingBox", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolygon() {
        software.amazon.jsii.Kernel.call(this, "resetPolygon", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference getBoundingBox() {
        return software.amazon.jsii.Kernel.get(this, "boundingBox", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBoxOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestPolygonList getPolygon() {
        return software.amazon.jsii.Kernel.get(this, "polygon", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestPolygonList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBoundingBoxInput() {
        return software.amazon.jsii.Kernel.get(this, "boundingBoxInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPolygonInput() {
        return software.amazon.jsii.Kernel.get(this, "polygonInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterest value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
