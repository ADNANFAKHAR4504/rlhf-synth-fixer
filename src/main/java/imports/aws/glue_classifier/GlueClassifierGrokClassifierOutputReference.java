package imports.aws.glue_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.287Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueClassifier.GlueClassifierGrokClassifierOutputReference")
public class GlueClassifierGrokClassifierOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueClassifierGrokClassifierOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueClassifierGrokClassifierOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueClassifierGrokClassifierOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCustomPatterns() {
        software.amazon.jsii.Kernel.call(this, "resetCustomPatterns", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClassificationInput() {
        return software.amazon.jsii.Kernel.get(this, "classificationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomPatternsInput() {
        return software.amazon.jsii.Kernel.get(this, "customPatternsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGrokPatternInput() {
        return software.amazon.jsii.Kernel.get(this, "grokPatternInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClassification() {
        return software.amazon.jsii.Kernel.get(this, "classification", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClassification(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "classification", java.util.Objects.requireNonNull(value, "classification is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomPatterns() {
        return software.amazon.jsii.Kernel.get(this, "customPatterns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomPatterns(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customPatterns", java.util.Objects.requireNonNull(value, "customPatterns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGrokPattern() {
        return software.amazon.jsii.Kernel.get(this, "grokPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGrokPattern(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "grokPattern", java.util.Objects.requireNonNull(value, "grokPattern is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_classifier.GlueClassifierGrokClassifier getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierGrokClassifier.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_classifier.GlueClassifierGrokClassifier value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
