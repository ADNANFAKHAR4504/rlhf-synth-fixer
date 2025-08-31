package imports.aws.rds_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.141Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsCluster.RdsClusterS3ImportOutputReference")
public class RdsClusterS3ImportOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RdsClusterS3ImportOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RdsClusterS3ImportOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RdsClusterS3ImportOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBucketPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetBucketPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIngestionRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "ingestionRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceEngineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceEngineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketPrefix() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketPrefix", java.util.Objects.requireNonNull(value, "bucketPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIngestionRole() {
        return software.amazon.jsii.Kernel.get(this, "ingestionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIngestionRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ingestionRole", java.util.Objects.requireNonNull(value, "ingestionRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceEngine() {
        return software.amazon.jsii.Kernel.get(this, "sourceEngine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceEngine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceEngine", java.util.Objects.requireNonNull(value, "sourceEngine is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "sourceEngineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceEngineVersion", java.util.Objects.requireNonNull(value, "sourceEngineVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterS3Import getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterS3Import.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterS3Import value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
