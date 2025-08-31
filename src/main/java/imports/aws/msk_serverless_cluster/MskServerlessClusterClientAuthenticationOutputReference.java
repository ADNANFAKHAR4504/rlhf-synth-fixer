package imports.aws.msk_serverless_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.914Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskServerlessCluster.MskServerlessClusterClientAuthenticationOutputReference")
public class MskServerlessClusterClientAuthenticationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskServerlessClusterClientAuthenticationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskServerlessClusterClientAuthenticationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskServerlessClusterClientAuthenticationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSasl(final @org.jetbrains.annotations.NotNull imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl value) {
        software.amazon.jsii.Kernel.call(this, "putSasl", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSaslOutputReference getSasl() {
        return software.amazon.jsii.Kernel.get(this, "sasl", software.amazon.jsii.NativeType.forClass(imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSaslOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl getSaslInput() {
        return software.amazon.jsii.Kernel.get(this, "saslInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthentication getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthentication.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthentication value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
