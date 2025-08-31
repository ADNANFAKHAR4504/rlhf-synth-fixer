package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.912Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorKafkaClusterAmazonMskClusterOutputReference")
public class MskReplicatorKafkaClusterAmazonMskClusterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskReplicatorKafkaClusterAmazonMskClusterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskReplicatorKafkaClusterAmazonMskClusterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskReplicatorKafkaClusterAmazonMskClusterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMskClusterArnInput() {
        return software.amazon.jsii.Kernel.get(this, "mskClusterArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMskClusterArn() {
        return software.amazon.jsii.Kernel.get(this, "mskClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMskClusterArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mskClusterArn", java.util.Objects.requireNonNull(value, "mskClusterArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorKafkaClusterAmazonMskCluster getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorKafkaClusterAmazonMskCluster.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorKafkaClusterAmazonMskCluster value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
