package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.300Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectBuildBatchConfigOutputReference")
public class CodebuildProjectBuildBatchConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectBuildBatchConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectBuildBatchConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildProjectBuildBatchConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRestrictions(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions value) {
        software.amazon.jsii.Kernel.call(this, "putRestrictions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCombineArtifacts() {
        software.amazon.jsii.Kernel.call(this, "resetCombineArtifacts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestrictions() {
        software.amazon.jsii.Kernel.call(this, "resetRestrictions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutInMins() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutInMins", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictionsOutputReference getRestrictions() {
        return software.amazon.jsii.Kernel.get(this, "restrictions", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCombineArtifactsInput() {
        return software.amazon.jsii.Kernel.get(this, "combineArtifactsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions getRestrictionsInput() {
        return software.amazon.jsii.Kernel.get(this, "restrictionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInMinsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInMinsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCombineArtifacts() {
        return software.amazon.jsii.Kernel.get(this, "combineArtifacts", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCombineArtifacts(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "combineArtifacts", java.util.Objects.requireNonNull(value, "combineArtifacts is required"));
    }

    public void setCombineArtifacts(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "combineArtifacts", java.util.Objects.requireNonNull(value, "combineArtifacts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRole() {
        return software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRole", java.util.Objects.requireNonNull(value, "serviceRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutInMins() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInMins", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutInMins(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutInMins", java.util.Objects.requireNonNull(value, "timeoutInMins is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
