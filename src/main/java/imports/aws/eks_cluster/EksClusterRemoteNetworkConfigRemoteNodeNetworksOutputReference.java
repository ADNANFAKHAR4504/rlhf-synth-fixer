package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference")
public class EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCidrs() {
        software.amazon.jsii.Kernel.call(this, "resetCidrs", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCidrsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "cidrsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCidrs() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "cidrs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCidrs(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "cidrs", java.util.Objects.requireNonNull(value, "cidrs is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
