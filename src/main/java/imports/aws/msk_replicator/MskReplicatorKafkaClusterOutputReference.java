package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.912Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorKafkaClusterOutputReference")
public class MskReplicatorKafkaClusterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskReplicatorKafkaClusterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskReplicatorKafkaClusterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MskReplicatorKafkaClusterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAmazonMskCluster(final @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorKafkaClusterAmazonMskCluster value) {
        software.amazon.jsii.Kernel.call(this, "putAmazonMskCluster", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorKafkaClusterVpcConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorKafkaClusterAmazonMskClusterOutputReference getAmazonMskCluster() {
        return software.amazon.jsii.Kernel.get(this, "amazonMskCluster", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorKafkaClusterAmazonMskClusterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorKafkaClusterVpcConfigOutputReference getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorKafkaClusterVpcConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorKafkaClusterAmazonMskCluster getAmazonMskClusterInput() {
        return software.amazon.jsii.Kernel.get(this, "amazonMskClusterInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorKafkaClusterAmazonMskCluster.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorKafkaClusterVpcConfig getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorKafkaClusterVpcConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorKafkaCluster value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
