package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.157Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterEncryptionConfigOutputReference")
public class EksClusterEncryptionConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksClusterEncryptionConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksClusterEncryptionConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksClusterEncryptionConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putProvider(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterEncryptionConfigProvider value) {
        software.amazon.jsii.Kernel.call(this, "putProvider", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterEncryptionConfigProviderOutputReference getProvider() {
        return software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterEncryptionConfigProviderOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterEncryptionConfigProvider getProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "providerInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterEncryptionConfigProvider.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourcesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourcesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResources() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResources(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resources", java.util.Objects.requireNonNull(value, "resources is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterEncryptionConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterEncryptionConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterEncryptionConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
