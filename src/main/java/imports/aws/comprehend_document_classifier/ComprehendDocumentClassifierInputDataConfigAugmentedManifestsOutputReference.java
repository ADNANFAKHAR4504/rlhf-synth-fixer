package imports.aws.comprehend_document_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.360Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendDocumentClassifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifestsOutputReference")
public class ComprehendDocumentClassifierInputDataConfigAugmentedManifestsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ComprehendDocumentClassifierInputDataConfigAugmentedManifestsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ComprehendDocumentClassifierInputDataConfigAugmentedManifestsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ComprehendDocumentClassifierInputDataConfigAugmentedManifestsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAnnotationDataS3Uri() {
        software.amazon.jsii.Kernel.call(this, "resetAnnotationDataS3Uri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentType() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceDocumentsS3Uri() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDocumentsS3Uri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSplit() {
        software.amazon.jsii.Kernel.call(this, "resetSplit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAnnotationDataS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "annotationDataS3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAttributeNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "attributeNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocumentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "documentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "s3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceDocumentsS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDocumentsS3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSplitInput() {
        return software.amazon.jsii.Kernel.get(this, "splitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAnnotationDataS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "annotationDataS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAnnotationDataS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "annotationDataS3Uri", java.util.Objects.requireNonNull(value, "annotationDataS3Uri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAttributeNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "attributeNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAttributeNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "attributeNames", java.util.Objects.requireNonNull(value, "attributeNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentType() {
        return software.amazon.jsii.Kernel.get(this, "documentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocumentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "documentType", java.util.Objects.requireNonNull(value, "documentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Uri", java.util.Objects.requireNonNull(value, "s3Uri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceDocumentsS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "sourceDocumentsS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceDocumentsS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceDocumentsS3Uri", java.util.Objects.requireNonNull(value, "sourceDocumentsS3Uri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSplit() {
        return software.amazon.jsii.Kernel.get(this, "split", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSplit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "split", java.util.Objects.requireNonNull(value, "split is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifests value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
