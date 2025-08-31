package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterEncryptionConfigProviderOutputReference")
public class EksClusterEncryptionConfigProviderOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksClusterEncryptionConfigProviderOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksClusterEncryptionConfigProviderOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksClusterEncryptionConfigProviderOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "keyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "keyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyArn", java.util.Objects.requireNonNull(value, "keyArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterEncryptionConfigProvider getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterEncryptionConfigProvider.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterEncryptionConfigProvider value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
