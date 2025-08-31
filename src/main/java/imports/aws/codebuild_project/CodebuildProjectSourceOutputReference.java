package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectSourceOutputReference")
public class CodebuildProjectSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildProjectSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAuth(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSourceAuth value) {
        software.amazon.jsii.Kernel.call(this, "putAuth", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBuildStatusConfig(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSourceBuildStatusConfig value) {
        software.amazon.jsii.Kernel.call(this, "putBuildStatusConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGitSubmodulesConfig(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSourceGitSubmodulesConfig value) {
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

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSourceAuthOutputReference getAuth() {
        return software.amazon.jsii.Kernel.get(this, "auth", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSourceAuthOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSourceBuildStatusConfigOutputReference getBuildStatusConfig() {
        return software.amazon.jsii.Kernel.get(this, "buildStatusConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSourceBuildStatusConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSourceGitSubmodulesConfigOutputReference getGitSubmodulesConfig() {
        return software.amazon.jsii.Kernel.get(this, "gitSubmodulesConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSourceGitSubmodulesConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSourceAuth getAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "authInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSourceAuth.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBuildspecInput() {
        return software.amazon.jsii.Kernel.get(this, "buildspecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSourceBuildStatusConfig getBuildStatusConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "buildStatusConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSourceBuildStatusConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getGitCloneDepthInput() {
        return software.amazon.jsii.Kernel.get(this, "gitCloneDepthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSourceGitSubmodulesConfig getGitSubmodulesConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "gitSubmodulesConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSourceGitSubmodulesConfig.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
