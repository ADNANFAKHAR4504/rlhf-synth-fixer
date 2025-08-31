package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationS3ConfigurationOutputReference")
public class KendraDataSourceConfigurationS3ConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceConfigurationS3ConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceConfigurationS3ConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraDataSourceConfigurationS3ConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAccessControlListConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAccessControlListConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDocumentsMetadataConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putDocumentsMetadataConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessControlListConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAccessControlListConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentsMetadataConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentsMetadataConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExclusionPatterns() {
        software.amazon.jsii.Kernel.call(this, "resetExclusionPatterns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInclusionPatterns() {
        software.amazon.jsii.Kernel.call(this, "resetInclusionPatterns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInclusionPrefixes() {
        software.amazon.jsii.Kernel.call(this, "resetInclusionPrefixes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfigurationOutputReference getAccessControlListConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "accessControlListConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfigurationOutputReference getDocumentsMetadataConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "documentsMetadataConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration getAccessControlListConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "accessControlListConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration getDocumentsMetadataConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "documentsMetadataConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExclusionPatternsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "exclusionPatternsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInclusionPatternsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "inclusionPatternsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInclusionPrefixesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "inclusionPrefixesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExclusionPatterns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "exclusionPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExclusionPatterns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "exclusionPatterns", java.util.Objects.requireNonNull(value, "exclusionPatterns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInclusionPatterns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "inclusionPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInclusionPatterns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "inclusionPatterns", java.util.Objects.requireNonNull(value, "inclusionPatterns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInclusionPrefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "inclusionPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInclusionPrefixes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "inclusionPrefixes", java.util.Objects.requireNonNull(value, "inclusionPrefixes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
