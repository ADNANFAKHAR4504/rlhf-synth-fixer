package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterStorageConfigOutputReference")
public class EksClusterStorageConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksClusterStorageConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksClusterStorageConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksClusterStorageConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBlockStorage(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage value) {
        software.amazon.jsii.Kernel.call(this, "putBlockStorage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBlockStorage() {
        software.amazon.jsii.Kernel.call(this, "resetBlockStorage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterStorageConfigBlockStorageOutputReference getBlockStorage() {
        return software.amazon.jsii.Kernel.get(this, "blockStorage", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterStorageConfigBlockStorageOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage getBlockStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "blockStorageInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterStorageConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterStorageConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterStorageConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
