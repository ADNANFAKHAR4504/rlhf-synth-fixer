package imports.aws.quicksight_analysis;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.098Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightAnalysis.QuicksightAnalysisSourceEntityOutputReference")
public class QuicksightAnalysisSourceEntityOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightAnalysisSourceEntityOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightAnalysisSourceEntityOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightAnalysisSourceEntityOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSourceTemplate(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putSourceTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSourceTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetSourceTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplateOutputReference getSourceTemplate() {
        return software.amazon.jsii.Kernel.get(this, "sourceTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate getSourceTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
