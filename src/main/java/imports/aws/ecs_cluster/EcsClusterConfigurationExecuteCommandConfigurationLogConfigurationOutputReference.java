package imports.aws.ecs_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfigurationOutputReference")
public class EcsClusterConfigurationExecuteCommandConfigurationLogConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsClusterConfigurationExecuteCommandConfigurationLogConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsClusterConfigurationExecuteCommandConfigurationLogConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsClusterConfigurationExecuteCommandConfigurationLogConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCloudWatchEncryptionEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCloudWatchEncryptionEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudWatchLogGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetCloudWatchLogGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3BucketEncryptionEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetS3BucketEncryptionEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3BucketName() {
        software.amazon.jsii.Kernel.call(this, "resetS3BucketName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3KeyPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetS3KeyPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudWatchEncryptionEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchEncryptionEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudWatchLogGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchLogGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getS3BucketEncryptionEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketEncryptionEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCloudWatchEncryptionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCloudWatchEncryptionEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cloudWatchEncryptionEnabled", java.util.Objects.requireNonNull(value, "cloudWatchEncryptionEnabled is required"));
    }

    public void setCloudWatchEncryptionEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cloudWatchEncryptionEnabled", java.util.Objects.requireNonNull(value, "cloudWatchEncryptionEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudWatchLogGroupName() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchLogGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudWatchLogGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudWatchLogGroupName", java.util.Objects.requireNonNull(value, "cloudWatchLogGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getS3BucketEncryptionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setS3BucketEncryptionEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "s3BucketEncryptionEnabled", java.util.Objects.requireNonNull(value, "s3BucketEncryptionEnabled is required"));
    }

    public void setS3BucketEncryptionEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "s3BucketEncryptionEnabled", java.util.Objects.requireNonNull(value, "s3BucketEncryptionEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3BucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3BucketName", java.util.Objects.requireNonNull(value, "s3BucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3KeyPrefix() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3KeyPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3KeyPrefix", java.util.Objects.requireNonNull(value, "s3KeyPrefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
