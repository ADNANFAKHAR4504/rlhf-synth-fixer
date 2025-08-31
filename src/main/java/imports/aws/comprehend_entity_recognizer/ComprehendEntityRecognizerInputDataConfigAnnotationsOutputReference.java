package imports.aws.comprehend_entity_recognizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendEntityRecognizer.ComprehendEntityRecognizerInputDataConfigAnnotationsOutputReference")
public class ComprehendEntityRecognizerInputDataConfigAnnotationsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ComprehendEntityRecognizerInputDataConfigAnnotationsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ComprehendEntityRecognizerInputDataConfigAnnotationsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ComprehendEntityRecognizerInputDataConfigAnnotationsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetTestS3Uri() {
        software.amazon.jsii.Kernel.call(this, "resetTestS3Uri", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "s3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTestS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "testS3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Uri", java.util.Objects.requireNonNull(value, "s3Uri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTestS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "testS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTestS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "testS3Uri", java.util.Objects.requireNonNull(value, "testS3Uri is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
