package imports.aws.codegurureviewer_repository_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codegurureviewerRepositoryAssociation.CodegurureviewerRepositoryAssociationRepositoryOutputReference")
public class CodegurureviewerRepositoryAssociationRepositoryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodegurureviewerRepositoryAssociationRepositoryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodegurureviewerRepositoryAssociationRepositoryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodegurureviewerRepositoryAssociationRepositoryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBitbucket(final @org.jetbrains.annotations.NotNull imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket value) {
        software.amazon.jsii.Kernel.call(this, "putBitbucket", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCodecommit(final @org.jetbrains.annotations.NotNull imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit value) {
        software.amazon.jsii.Kernel.call(this, "putCodecommit", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGithubEnterpriseServer(final @org.jetbrains.annotations.NotNull imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer value) {
        software.amazon.jsii.Kernel.call(this, "putGithubEnterpriseServer", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Bucket(final @org.jetbrains.annotations.NotNull imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket value) {
        software.amazon.jsii.Kernel.call(this, "putS3Bucket", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBitbucket() {
        software.amazon.jsii.Kernel.call(this, "resetBitbucket", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodecommit() {
        software.amazon.jsii.Kernel.call(this, "resetCodecommit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGithubEnterpriseServer() {
        software.amazon.jsii.Kernel.call(this, "resetGithubEnterpriseServer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Bucket() {
        software.amazon.jsii.Kernel.call(this, "resetS3Bucket", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucketOutputReference getBitbucket() {
        return software.amazon.jsii.Kernel.get(this, "bitbucket", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucketOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommitOutputReference getCodecommit() {
        return software.amazon.jsii.Kernel.get(this, "codecommit", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommitOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServerOutputReference getGithubEnterpriseServer() {
        return software.amazon.jsii.Kernel.get(this, "githubEnterpriseServer", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServerOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3BucketOutputReference getS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3BucketOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket getBitbucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bitbucketInput", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryBitbucket.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit getCodecommitInput() {
        return software.amazon.jsii.Kernel.get(this, "codecommitInput", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryCodecommit.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer getGithubEnterpriseServerInput() {
        return software.amazon.jsii.Kernel.get(this, "githubEnterpriseServerInput", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryGithubEnterpriseServer.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket getS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketInput", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepositoryS3Bucket.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepository getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepository.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codegurureviewer_repository_association.CodegurureviewerRepositoryAssociationRepository value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
