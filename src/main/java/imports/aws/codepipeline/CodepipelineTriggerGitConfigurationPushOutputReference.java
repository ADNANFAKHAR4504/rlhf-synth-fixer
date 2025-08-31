package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.335Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineTriggerGitConfigurationPushOutputReference")
public class CodepipelineTriggerGitConfigurationPushOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineTriggerGitConfigurationPushOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineTriggerGitConfigurationPushOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CodepipelineTriggerGitConfigurationPushOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putBranches(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches value) {
        software.amazon.jsii.Kernel.call(this, "putBranches", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilePaths(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths value) {
        software.amazon.jsii.Kernel.call(this, "putFilePaths", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTags(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags value) {
        software.amazon.jsii.Kernel.call(this, "putTags", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBranches() {
        software.amazon.jsii.Kernel.call(this, "resetBranches", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilePaths() {
        software.amazon.jsii.Kernel.call(this, "resetFilePaths", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranchesOutputReference getBranches() {
        return software.amazon.jsii.Kernel.get(this, "branches", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranchesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePathsOutputReference getFilePaths() {
        return software.amazon.jsii.Kernel.get(this, "filePaths", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePathsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTagsOutputReference getTags() {
        return software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTagsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches getBranchesInput() {
        return software.amazon.jsii.Kernel.get(this, "branchesInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths getFilePathsInput() {
        return software.amazon.jsii.Kernel.get(this, "filePathsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags getTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPush value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
