package imports.aws.glue_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueJob.GlueJobSourceControlDetailsOutputReference")
public class GlueJobSourceControlDetailsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueJobSourceControlDetailsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueJobSourceControlDetailsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueJobSourceControlDetailsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuthStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetAuthStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthToken() {
        software.amazon.jsii.Kernel.call(this, "resetAuthToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBranch() {
        software.amazon.jsii.Kernel.call(this, "resetBranch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFolder() {
        software.amazon.jsii.Kernel.call(this, "resetFolder", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastCommitId() {
        software.amazon.jsii.Kernel.call(this, "resetLastCommitId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOwner() {
        software.amazon.jsii.Kernel.call(this, "resetOwner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProvider() {
        software.amazon.jsii.Kernel.call(this, "resetProvider", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepository() {
        software.amazon.jsii.Kernel.call(this, "resetRepository", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "authStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "authTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBranchInput() {
        return software.amazon.jsii.Kernel.get(this, "branchInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFolderInput() {
        return software.amazon.jsii.Kernel.get(this, "folderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLastCommitIdInput() {
        return software.amazon.jsii.Kernel.get(this, "lastCommitIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "ownerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "providerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRepositoryInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthStrategy() {
        return software.amazon.jsii.Kernel.get(this, "authStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authStrategy", java.util.Objects.requireNonNull(value, "authStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthToken() {
        return software.amazon.jsii.Kernel.get(this, "authToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authToken", java.util.Objects.requireNonNull(value, "authToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBranch() {
        return software.amazon.jsii.Kernel.get(this, "branch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBranch(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "branch", java.util.Objects.requireNonNull(value, "branch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFolder() {
        return software.amazon.jsii.Kernel.get(this, "folder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFolder(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "folder", java.util.Objects.requireNonNull(value, "folder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastCommitId() {
        return software.amazon.jsii.Kernel.get(this, "lastCommitId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLastCommitId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lastCommitId", java.util.Objects.requireNonNull(value, "lastCommitId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwner() {
        return software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "owner", java.util.Objects.requireNonNull(value, "owner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProvider() {
        return software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProvider(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "provider", java.util.Objects.requireNonNull(value, "provider is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRepository() {
        return software.amazon.jsii.Kernel.get(this, "repository", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRepository(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "repository", java.util.Objects.requireNonNull(value, "repository is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobSourceControlDetails getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobSourceControlDetails.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobSourceControlDetails value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
