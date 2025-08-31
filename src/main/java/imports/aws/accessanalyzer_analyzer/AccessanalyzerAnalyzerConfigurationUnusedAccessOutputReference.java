package imports.aws.accessanalyzer_analyzer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessOutputReference")
public class AccessanalyzerAnalyzerConfigurationUnusedAccessOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AccessanalyzerAnalyzerConfigurationUnusedAccessOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AccessanalyzerAnalyzerConfigurationUnusedAccessOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AccessanalyzerAnalyzerConfigurationUnusedAccessOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAnalysisRule(final @org.jetbrains.annotations.NotNull imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule value) {
        software.amazon.jsii.Kernel.call(this, "putAnalysisRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAnalysisRule() {
        software.amazon.jsii.Kernel.call(this, "resetAnalysisRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnusedAccessAge() {
        software.amazon.jsii.Kernel.call(this, "resetUnusedAccessAge", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleOutputReference getAnalysisRule() {
        return software.amazon.jsii.Kernel.get(this, "analysisRule", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule getAnalysisRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "analysisRuleInput", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUnusedAccessAgeInput() {
        return software.amazon.jsii.Kernel.get(this, "unusedAccessAgeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUnusedAccessAge() {
        return software.amazon.jsii.Kernel.get(this, "unusedAccessAge", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUnusedAccessAge(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "unusedAccessAge", java.util.Objects.requireNonNull(value, "unusedAccessAge is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
