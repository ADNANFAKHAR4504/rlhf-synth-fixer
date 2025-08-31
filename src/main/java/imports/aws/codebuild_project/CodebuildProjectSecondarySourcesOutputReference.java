package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectSecondarySourcesOutputReference")
public class CodebuildProjectSecondarySourcesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectSecondarySourcesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectSecondarySourcesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CodebuildProjectSecondarySourcesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAuth(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSecondarySourcesAuth value) {
        software.amazon.jsii.Kernel.call(this, "putAuth", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBuildStatusConfig(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSecondarySourcesBuildStatusConfig value) {
        software.amazon.jsii.Kernel.call(this, "putBuildStatusConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGitSubmodulesConfig(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSecondarySourcesGitSubmodulesConfig value) {
        software.amazon.jsii.Kernel.call(this, "putGitSubmodulesConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuth() {
        software.amazon.jsii.Kernel.call(this, "resetAuth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBuildspec() {
        software.amazon.jsii.Kernel.call(this, "resetBuildspec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBuildStatusConfig() {
        software.amazon.jsii.Kernel.call(this, "resetBuildStatusConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGitCloneDepth() {
        software.amazon.jsii.Kernel.call(this, "resetGitCloneDepth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGitSubmodulesConfig() {
        software.amazon.jsii.Kernel.call(this, "resetGitSubmodulesConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInsecureSsl() {
        software.amazon.jsii.Kernel.call(this, "resetInsecureSsl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocation() {
        software.amazon.jsii.Kernel.call(this, "resetLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReportBuildStatus() {
        software.amazon.jsii.Kernel.call(this, "resetReportBuildStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSecondarySourcesAuthOutputReference getAuth() {
        return software.amazon.jsii.Kernel.get(this, "auth", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSecondarySourcesAuthOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSecondarySourcesBuildStatusConfigOutputReference getBuildStatusConfig() {
        return software.amazon.jsii.Kernel.get(this, "buildStatusConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSecondarySourcesBuildStatusConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSecondarySourcesGitSubmodulesConfigOutputReference getGitSubmodulesConfig() {
        return software.amazon.jsii.Kernel.get(this, "gitSubmodulesConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSecondarySourcesGitSubmodulesConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSecondarySourcesAuth getAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "authInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSecondarySourcesAuth.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBuildspecInput() {
        return software.amazon.jsii.Kernel.get(this, "buildspecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSecondarySourcesBuildStatusConfig getBuildStatusConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "buildStatusConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSecondarySourcesBuildStatusConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getGitCloneDepthInput() {
        return software.amazon.jsii.Kernel.get(this, "gitCloneDepthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSecondarySourcesGitSubmodulesConfig getGitSubmodulesConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "gitSubmodulesConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSecondarySourcesGitSubmodulesConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInsecureSslInput() {
        return software.amazon.jsii.Kernel.get(this, "insecureSslInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "locationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReportBuildStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "reportBuildStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBuildspec() {
        return software.amazon.jsii.Kernel.get(this, "buildspec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBuildspec(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "buildspec", java.util.Objects.requireNonNull(value, "buildspec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getGitCloneDepth() {
        return software.amazon.jsii.Kernel.get(this, "gitCloneDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setGitCloneDepth(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "gitCloneDepth", java.util.Objects.requireNonNull(value, "gitCloneDepth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInsecureSsl() {
        return software.amazon.jsii.Kernel.get(this, "insecureSsl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInsecureSsl(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "insecureSsl", java.util.Objects.requireNonNull(value, "insecureSsl is required"));
    }

    public void setInsecureSsl(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "insecureSsl", java.util.Objects.requireNonNull(value, "insecureSsl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocation() {
        return software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "location", java.util.Objects.requireNonNull(value, "location is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReportBuildStatus() {
        return software.amazon.jsii.Kernel.get(this, "reportBuildStatus", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReportBuildStatus(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "reportBuildStatus", java.util.Objects.requireNonNull(value, "reportBuildStatus is required"));
    }

    public void setReportBuildStatus(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "reportBuildStatus", java.util.Objects.requireNonNull(value, "reportBuildStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "sourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceIdentifier", java.util.Objects.requireNonNull(value, "sourceIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSecondarySources value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
