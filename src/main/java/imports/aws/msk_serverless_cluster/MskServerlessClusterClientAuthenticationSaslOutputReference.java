package imports.aws.msk_serverless_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.914Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskServerlessCluster.MskServerlessClusterClientAuthenticationSaslOutputReference")
public class MskServerlessClusterClientAuthenticationSaslOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskServerlessClusterClientAuthenticationSaslOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskServerlessClusterClientAuthenticationSaslOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskServerlessClusterClientAuthenticationSaslOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIam(final @org.jetbrains.annotations.NotNull imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSaslIam value) {
        software.amazon.jsii.Kernel.call(this, "putIam", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSaslIamOutputReference getIam() {
        return software.amazon.jsii.Kernel.get(this, "iam", software.amazon.jsii.NativeType.forClass(imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSaslIamOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSaslIam getIamInput() {
        return software.amazon.jsii.Kernel.get(this, "iamInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSaslIam.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
