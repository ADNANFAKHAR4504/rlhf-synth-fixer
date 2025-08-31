package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectSourceGitSubmodulesConfigOutputReference")
public class CodebuildProjectSourceGitSubmodulesConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectSourceGitSubmodulesConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectSourceGitSubmodulesConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildProjectSourceGitSubmodulesConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFetchSubmodulesInput() {
        return software.amazon.jsii.Kernel.get(this, "fetchSubmodulesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFetchSubmodules() {
        return software.amazon.jsii.Kernel.get(this, "fetchSubmodules", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFetchSubmodules(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "fetchSubmodules", java.util.Objects.requireNonNull(value, "fetchSubmodules is required"));
    }

    public void setFetchSubmodules(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "fetchSubmodules", java.util.Objects.requireNonNull(value, "fetchSubmodules is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSourceGitSubmodulesConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSourceGitSubmodulesConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSourceGitSubmodulesConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
