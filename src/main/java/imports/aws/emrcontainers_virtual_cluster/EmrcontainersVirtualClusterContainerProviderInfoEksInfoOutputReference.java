package imports.aws.emrcontainers_virtual_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersVirtualCluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfoOutputReference")
public class EmrcontainersVirtualClusterContainerProviderInfoEksInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrcontainersVirtualClusterContainerProviderInfoEksInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrcontainersVirtualClusterContainerProviderInfoEksInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrcontainersVirtualClusterContainerProviderInfoEksInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetNamespace() {
        software.amazon.jsii.Kernel.call(this, "resetNamespace", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "namespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespace() {
        return software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namespace", java.util.Objects.requireNonNull(value, "namespace is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
