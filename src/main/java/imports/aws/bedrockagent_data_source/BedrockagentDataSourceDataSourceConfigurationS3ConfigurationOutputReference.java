package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.163Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationS3ConfigurationOutputReference")
public class BedrockagentDataSourceDataSourceConfigurationS3ConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentDataSourceDataSourceConfigurationS3ConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentDataSourceDataSourceConfigurationS3ConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentDataSourceDataSourceConfigurationS3ConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetBucketOwnerAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetBucketOwnerAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInclusionPrefixes() {
        software.amazon.jsii.Kernel.call(this, "resetInclusionPrefixes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketArnInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketOwnerAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketOwnerAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInclusionPrefixesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "inclusionPrefixesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketArn() {
        return software.amazon.jsii.Kernel.get(this, "bucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketArn", java.util.Objects.requireNonNull(value, "bucketArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketOwnerAccountId() {
        return software.amazon.jsii.Kernel.get(this, "bucketOwnerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketOwnerAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketOwnerAccountId", java.util.Objects.requireNonNull(value, "bucketOwnerAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInclusionPrefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "inclusionPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInclusionPrefixes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "inclusionPrefixes", java.util.Objects.requireNonNull(value, "inclusionPrefixes is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationS3Configuration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
