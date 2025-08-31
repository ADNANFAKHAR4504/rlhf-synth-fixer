package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.334Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference")
public class CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetExcludes() {
        software.amazon.jsii.Kernel.call(this, "resetExcludes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludes() {
        software.amazon.jsii.Kernel.call(this, "resetIncludes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "excludesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "includesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExcludes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "excludes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExcludes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "excludes", java.util.Objects.requireNonNull(value, "excludes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIncludes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "includes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIncludes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "includes", java.util.Objects.requireNonNull(value, "includes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
