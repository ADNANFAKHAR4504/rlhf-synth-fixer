package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectSourceBuildStatusConfigOutputReference")
public class CodebuildProjectSourceBuildStatusConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectSourceBuildStatusConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectSourceBuildStatusConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildProjectSourceBuildStatusConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetContext() {
        software.amazon.jsii.Kernel.call(this, "resetContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetUrl() {
        software.amazon.jsii.Kernel.call(this, "resetTargetUrl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContextInput() {
        return software.amazon.jsii.Kernel.get(this, "contextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "targetUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContext() {
        return software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContext(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "context", java.util.Objects.requireNonNull(value, "context is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetUrl() {
        return software.amazon.jsii.Kernel.get(this, "targetUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetUrl", java.util.Objects.requireNonNull(value, "targetUrl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSourceBuildStatusConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSourceBuildStatusConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectSourceBuildStatusConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
