package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterCodeOutputReference")
public class FinspaceKxClusterCodeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FinspaceKxClusterCodeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxClusterCodeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FinspaceKxClusterCodeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetS3ObjectVersion() {
        software.amazon.jsii.Kernel.call(this, "resetS3ObjectVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ObjectVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Bucket", java.util.Objects.requireNonNull(value, "s3Bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Key() {
        return software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Key(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Key", java.util.Objects.requireNonNull(value, "s3Key is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3ObjectVersion() {
        return software.amazon.jsii.Kernel.get(this, "s3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3ObjectVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3ObjectVersion", java.util.Objects.requireNonNull(value, "s3ObjectVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterCode getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterCode.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterCode value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
