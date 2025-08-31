package imports.aws.accessanalyzer_analyzer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusionOutputReference")
public class AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAccountIds() {
        software.amazon.jsii.Kernel.call(this, "resetAccountIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceTags() {
        software.amazon.jsii.Kernel.call(this, "resetResourceTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccountIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "accountIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAccountIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "accountIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAccountIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "accountIds", java.util.Objects.requireNonNull(value, "accountIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getResourceTags() {
        return software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setResourceTags(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "resourceTags", java.util.Objects.requireNonNull(value, "resourceTags is required"));
    }

    public void setResourceTags(final @org.jetbrains.annotations.NotNull java.util.List<java.util.Map<java.lang.String, java.lang.String>> value) {
        software.amazon.jsii.Kernel.set(this, "resourceTags", java.util.Objects.requireNonNull(value, "resourceTags is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
