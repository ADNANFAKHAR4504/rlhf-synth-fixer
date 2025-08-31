package imports.aws.s3_bucket_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.266Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleFilterOutputReference")
public class S3BucketReplicationConfigurationRuleFilterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketReplicationConfigurationRuleFilterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketReplicationConfigurationRuleFilterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketReplicationConfigurationRuleFilterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAnd(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterAnd value) {
        software.amazon.jsii.Kernel.call(this, "putAnd", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTag(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterTag value) {
        software.amazon.jsii.Kernel.call(this, "putTag", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAnd() {
        software.amazon.jsii.Kernel.call(this, "resetAnd", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTag() {
        software.amazon.jsii.Kernel.call(this, "resetTag", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterAndOutputReference getAnd() {
        return software.amazon.jsii.Kernel.get(this, "and", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterAndOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterTagOutputReference getTag() {
        return software.amazon.jsii.Kernel.get(this, "tag", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterTagOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterAnd getAndInput() {
        return software.amazon.jsii.Kernel.get(this, "andInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterAnd.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterTag getTagInput() {
        return software.amazon.jsii.Kernel.get(this, "tagInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilterTag.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "prefix", java.util.Objects.requireNonNull(value, "prefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
