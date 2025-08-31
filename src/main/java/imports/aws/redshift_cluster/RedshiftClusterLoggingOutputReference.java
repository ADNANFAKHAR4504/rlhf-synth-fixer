package imports.aws.redshift_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftCluster.RedshiftClusterLoggingOutputReference")
public class RedshiftClusterLoggingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RedshiftClusterLoggingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftClusterLoggingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RedshiftClusterLoggingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBucketName() {
        software.amazon.jsii.Kernel.call(this, "resetBucketName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogDestinationType() {
        software.amazon.jsii.Kernel.call(this, "resetLogDestinationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogExports() {
        software.amazon.jsii.Kernel.call(this, "resetLogExports", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3KeyPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetS3KeyPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableInput() {
        return software.amazon.jsii.Kernel.get(this, "enableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogDestinationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLogExportsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "logExportsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnable() {
        return software.amazon.jsii.Kernel.get(this, "enable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enable", java.util.Objects.requireNonNull(value, "enable is required"));
    }

    public void setEnable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enable", java.util.Objects.requireNonNull(value, "enable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogDestinationType() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogDestinationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logDestinationType", java.util.Objects.requireNonNull(value, "logDestinationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLogExports() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "logExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLogExports(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "logExports", java.util.Objects.requireNonNull(value, "logExports is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3KeyPrefix() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3KeyPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3KeyPrefix", java.util.Objects.requireNonNull(value, "s3KeyPrefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterLogging getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterLogging.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterLogging value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
