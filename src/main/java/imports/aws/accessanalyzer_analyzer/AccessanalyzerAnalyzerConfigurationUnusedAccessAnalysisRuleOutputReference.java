package imports.aws.accessanalyzer_analyzer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleOutputReference")
public class AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putExclusion(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion> __cast_cd4240 = (java.util.List<imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putExclusion", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExclusion() {
        software.amazon.jsii.Kernel.call(this, "resetExclusion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusionList getExclusion() {
        return software.amazon.jsii.Kernel.get(this, "exclusion", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExclusionInput() {
        return software.amazon.jsii.Kernel.get(this, "exclusionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
