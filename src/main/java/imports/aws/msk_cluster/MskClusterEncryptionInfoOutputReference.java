package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.910Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterEncryptionInfoOutputReference")
public class MskClusterEncryptionInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskClusterEncryptionInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskClusterEncryptionInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskClusterEncryptionInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEncryptionInTransit(final @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptionInTransit", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEncryptionAtRestKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionAtRestKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionInTransit() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionInTransit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransitOutputReference getEncryptionInTransit() {
        return software.amazon.jsii.Kernel.get(this, "encryptionInTransit", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransitOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptionAtRestKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAtRestKmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit getEncryptionInTransitInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionInTransitInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionAtRestKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAtRestKmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncryptionAtRestKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encryptionAtRestKmsKeyArn", java.util.Objects.requireNonNull(value, "encryptionAtRestKmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterEncryptionInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterEncryptionInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterEncryptionInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
