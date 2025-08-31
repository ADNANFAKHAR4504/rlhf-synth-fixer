package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsFaceSearchOutputReference")
public class RekognitionStreamProcessorSettingsFaceSearchOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RekognitionStreamProcessorSettingsFaceSearchOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RekognitionStreamProcessorSettingsFaceSearchOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public RekognitionStreamProcessorSettingsFaceSearchOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetFaceMatchThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetFaceMatchThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCollectionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "collectionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFaceMatchThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "faceMatchThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCollectionId() {
        return software.amazon.jsii.Kernel.get(this, "collectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCollectionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "collectionId", java.util.Objects.requireNonNull(value, "collectionId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFaceMatchThreshold() {
        return software.amazon.jsii.Kernel.get(this, "faceMatchThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFaceMatchThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "faceMatchThreshold", java.util.Objects.requireNonNull(value, "faceMatchThreshold is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettingsFaceSearch value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
