package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.335Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestOutputReference")
public class CodepipelineTriggerGitConfigurationPullRequestOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineTriggerGitConfigurationPullRequestOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineTriggerGitConfigurationPullRequestOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CodepipelineTriggerGitConfigurationPullRequestOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putBranches(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches value) {
        software.amazon.jsii.Kernel.call(this, "putBranches", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilePaths(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths value) {
        software.amazon.jsii.Kernel.call(this, "putFilePaths", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBranches() {
        software.amazon.jsii.Kernel.call(this, "resetBranches", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEvents() {
        software.amazon.jsii.Kernel.call(this, "resetEvents", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilePaths() {
        software.amazon.jsii.Kernel.call(this, "resetFilePaths", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference getBranches() {
        return software.amazon.jsii.Kernel.get(this, "branches", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePathsOutputReference getFilePaths() {
        return software.amazon.jsii.Kernel.get(this, "filePaths", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePathsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches getBranchesInput() {
        return software.amazon.jsii.Kernel.get(this, "branchesInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEventsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "eventsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths getFilePathsInput() {
        return software.amazon.jsii.Kernel.get(this, "filePathsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEvents() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "events", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEvents(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "events", java.util.Objects.requireNonNull(value, "events is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequest value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
