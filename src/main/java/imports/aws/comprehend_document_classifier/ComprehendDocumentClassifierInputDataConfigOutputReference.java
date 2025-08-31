package imports.aws.comprehend_document_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.360Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendDocumentClassifier.ComprehendDocumentClassifierInputDataConfigOutputReference")
public class ComprehendDocumentClassifierInputDataConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ComprehendDocumentClassifierInputDataConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ComprehendDocumentClassifierInputDataConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ComprehendDocumentClassifierInputDataConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAugmentedManifests(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifests>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifests> __cast_cd4240 = (java.util.List<imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifests>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifests __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAugmentedManifests", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAugmentedManifests() {
        software.amazon.jsii.Kernel.call(this, "resetAugmentedManifests", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataFormat() {
        software.amazon.jsii.Kernel.call(this, "resetDataFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLabelDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetLabelDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Uri() {
        software.amazon.jsii.Kernel.call(this, "resetS3Uri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTestS3Uri() {
        software.amazon.jsii.Kernel.call(this, "resetTestS3Uri", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifestsList getAugmentedManifests() {
        return software.amazon.jsii.Kernel.get(this, "augmentedManifests", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifestsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAugmentedManifestsInput() {
        return software.amazon.jsii.Kernel.get(this, "augmentedManifestsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "dataFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLabelDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "labelDelimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "s3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTestS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "testS3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataFormat() {
        return software.amazon.jsii.Kernel.get(this, "dataFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataFormat", java.util.Objects.requireNonNull(value, "dataFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLabelDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "labelDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLabelDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "labelDelimiter", java.util.Objects.requireNonNull(value, "labelDelimiter is required"));
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

    public @org.jetbrains.annotations.Nullable imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
