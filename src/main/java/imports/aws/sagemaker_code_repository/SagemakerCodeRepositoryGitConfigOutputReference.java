package imports.aws.sagemaker_code_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerCodeRepository.SagemakerCodeRepositoryGitConfigOutputReference")
public class SagemakerCodeRepositoryGitConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerCodeRepositoryGitConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerCodeRepositoryGitConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerCodeRepositoryGitConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBranch() {
        software.amazon.jsii.Kernel.call(this, "resetBranch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecretArn() {
        software.amazon.jsii.Kernel.call(this, "resetSecretArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBranchInput() {
        return software.amazon.jsii.Kernel.get(this, "branchInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRepositoryUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoryUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecretArnInput() {
        return software.amazon.jsii.Kernel.get(this, "secretArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBranch() {
        return software.amazon.jsii.Kernel.get(this, "branch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBranch(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "branch", java.util.Objects.requireNonNull(value, "branch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRepositoryUrl() {
        return software.amazon.jsii.Kernel.get(this, "repositoryUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRepositoryUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "repositoryUrl", java.util.Objects.requireNonNull(value, "repositoryUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecretArn() {
        return software.amazon.jsii.Kernel.get(this, "secretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecretArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secretArn", java.util.Objects.requireNonNull(value, "secretArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_code_repository.SagemakerCodeRepositoryGitConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_code_repository.SagemakerCodeRepositoryGitConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_code_repository.SagemakerCodeRepositoryGitConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
