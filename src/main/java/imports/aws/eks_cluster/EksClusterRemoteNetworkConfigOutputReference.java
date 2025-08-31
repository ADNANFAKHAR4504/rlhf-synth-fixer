package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterRemoteNetworkConfigOutputReference")
public class EksClusterRemoteNetworkConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksClusterRemoteNetworkConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksClusterRemoteNetworkConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksClusterRemoteNetworkConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRemoteNodeNetworks(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks value) {
        software.amazon.jsii.Kernel.call(this, "putRemoteNodeNetworks", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRemotePodNetworks(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks value) {
        software.amazon.jsii.Kernel.call(this, "putRemotePodNetworks", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRemotePodNetworks() {
        software.amazon.jsii.Kernel.call(this, "resetRemotePodNetworks", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference getRemoteNodeNetworks() {
        return software.amazon.jsii.Kernel.get(this, "remoteNodeNetworks", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworksOutputReference getRemotePodNetworks() {
        return software.amazon.jsii.Kernel.get(this, "remotePodNetworks", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworksOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks getRemoteNodeNetworksInput() {
        return software.amazon.jsii.Kernel.get(this, "remoteNodeNetworksInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks getRemotePodNetworksInput() {
        return software.amazon.jsii.Kernel.get(this, "remotePodNetworksInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
