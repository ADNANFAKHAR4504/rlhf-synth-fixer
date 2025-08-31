package imports.aws.emrcontainers_virtual_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersVirtualCluster.EmrcontainersVirtualClusterContainerProviderInfoOutputReference")
public class EmrcontainersVirtualClusterContainerProviderInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrcontainersVirtualClusterContainerProviderInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrcontainersVirtualClusterContainerProviderInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrcontainersVirtualClusterContainerProviderInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEksInfo(final @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfo value) {
        software.amazon.jsii.Kernel.call(this, "putEksInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfoOutputReference getEksInfo() {
        return software.amazon.jsii.Kernel.get(this, "eksInfo", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfo getEksInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "eksInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfo.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
