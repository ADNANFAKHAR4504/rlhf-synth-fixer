package imports.aws.data_aws_eks_cluster_versions;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.641Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEksClusterVersions.DataAwsEksClusterVersionsClusterVersionsOutputReference")
public class DataAwsEksClusterVersionsClusterVersionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsEksClusterVersionsClusterVersionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsEksClusterVersionsClusterVersionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsEksClusterVersionsClusterVersionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterType() {
        return software.amazon.jsii.Kernel.get(this, "clusterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterVersion() {
        return software.amazon.jsii.Kernel.get(this, "clusterVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultPlatformVersion() {
        return software.amazon.jsii.Kernel.get(this, "defaultPlatformVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getDefaultVersion() {
        return software.amazon.jsii.Kernel.get(this, "defaultVersion", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndOfExtendedSupportDate() {
        return software.amazon.jsii.Kernel.get(this, "endOfExtendedSupportDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndOfStandardSupportDate() {
        return software.amazon.jsii.Kernel.get(this, "endOfStandardSupportDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKubernetesPatchVersion() {
        return software.amazon.jsii.Kernel.get(this, "kubernetesPatchVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReleaseDate() {
        return software.amazon.jsii.Kernel.get(this, "releaseDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionStatus() {
        return software.amazon.jsii.Kernel.get(this, "versionStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsClusterVersions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsClusterVersions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsClusterVersions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
