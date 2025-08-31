package imports.aws.comprehend_entity_recognizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.366Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendEntityRecognizer.ComprehendEntityRecognizerInputDataConfigOutputReference")
public class ComprehendEntityRecognizerInputDataConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ComprehendEntityRecognizerInputDataConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ComprehendEntityRecognizerInputDataConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ComprehendEntityRecognizerInputDataConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAnnotations(final @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations value) {
        software.amazon.jsii.Kernel.call(this, "putAnnotations", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAugmentedManifests>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAugmentedManifests> __cast_cd4240 = (java.util.List<imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAugmentedManifests>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAugmentedManifests __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAugmentedManifests", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDocuments(final @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments value) {
        software.amazon.jsii.Kernel.call(this, "putDocuments", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEntityList(final @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct value) {
        software.amazon.jsii.Kernel.call(this, "putEntityList", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEntityTypes(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityTypes>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityTypes> __cast_cd4240 = (java.util.List<imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityTypes>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityTypes __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEntityTypes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAnnotations() {
        software.amazon.jsii.Kernel.call(this, "resetAnnotations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAugmentedManifests() {
        software.amazon.jsii.Kernel.call(this, "resetAugmentedManifests", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataFormat() {
        software.amazon.jsii.Kernel.call(this, "resetDataFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocuments() {
        software.amazon.jsii.Kernel.call(this, "resetDocuments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEntityList() {
        software.amazon.jsii.Kernel.call(this, "resetEntityList", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotationsOutputReference getAnnotations() {
        return software.amazon.jsii.Kernel.get(this, "annotations", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotationsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAugmentedManifestsList getAugmentedManifests() {
        return software.amazon.jsii.Kernel.get(this, "augmentedManifests", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAugmentedManifestsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocumentsOutputReference getDocuments() {
        return software.amazon.jsii.Kernel.get(this, "documents", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocumentsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStructOutputReference getEntityList() {
        return software.amazon.jsii.Kernel.get(this, "entityList", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStructOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityTypesList getEntityTypes() {
        return software.amazon.jsii.Kernel.get(this, "entityTypes", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityTypesList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations getAnnotationsInput() {
        return software.amazon.jsii.Kernel.get(this, "annotationsInput", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAugmentedManifestsInput() {
        return software.amazon.jsii.Kernel.get(this, "augmentedManifestsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "dataFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments getDocumentsInput() {
        return software.amazon.jsii.Kernel.get(this, "documentsInput", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct getEntityListInput() {
        return software.amazon.jsii.Kernel.get(this, "entityListInput", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEntityTypesInput() {
        return software.amazon.jsii.Kernel.get(this, "entityTypesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataFormat() {
        return software.amazon.jsii.Kernel.get(this, "dataFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataFormat", java.util.Objects.requireNonNull(value, "dataFormat is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
