package imports.aws.quicksight_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.124Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTemplate.QuicksightTemplateSourceEntityOutputReference")
public class QuicksightTemplateSourceEntityOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightTemplateSourceEntityOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightTemplateSourceEntityOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightTemplateSourceEntityOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSourceAnalysis(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis value) {
        software.amazon.jsii.Kernel.call(this, "putSourceAnalysis", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceTemplate(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putSourceTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSourceAnalysis() {
        software.amazon.jsii.Kernel.call(this, "resetSourceAnalysis", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetSourceTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysisOutputReference getSourceAnalysis() {
        return software.amazon.jsii.Kernel.get(this, "sourceAnalysis", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysisOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplateOutputReference getSourceTemplate() {
        return software.amazon.jsii.Kernel.get(this, "sourceTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis getSourceAnalysisInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceAnalysisInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate getSourceTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_template.QuicksightTemplateSourceEntity getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_template.QuicksightTemplateSourceEntity.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_template.QuicksightTemplateSourceEntity value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
