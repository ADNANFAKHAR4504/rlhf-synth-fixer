package imports.aws.data_aws_glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.663Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsGlueCatalogTable.DataAwsGlueCatalogTableStorageDescriptorOutputReference")
public class DataAwsGlueCatalogTableStorageDescriptorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsGlueCatalogTableStorageDescriptorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsGlueCatalogTableStorageDescriptorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsGlueCatalogTableStorageDescriptorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdditionalLocations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "additionalLocations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getBucketColumns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "bucketColumns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorColumnsList getColumns() {
        return software.amazon.jsii.Kernel.get(this, "columns", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorColumnsList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getCompressed() {
        return software.amazon.jsii.Kernel.get(this, "compressed", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputFormat() {
        return software.amazon.jsii.Kernel.get(this, "inputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocation() {
        return software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfBuckets() {
        return software.amazon.jsii.Kernel.get(this, "numberOfBuckets", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputFormat() {
        return software.amazon.jsii.Kernel.get(this, "outputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getParameters() {
        return software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorSchemaReferenceList getSchemaReference() {
        return software.amazon.jsii.Kernel.get(this, "schemaReference", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorSchemaReferenceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorSerDeInfoList getSerDeInfo() {
        return software.amazon.jsii.Kernel.get(this, "serDeInfo", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorSerDeInfoList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorSkewedInfoList getSkewedInfo() {
        return software.amazon.jsii.Kernel.get(this, "skewedInfo", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorSkewedInfoList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorSortColumnsList getSortColumns() {
        return software.amazon.jsii.Kernel.get(this, "sortColumns", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptorSortColumnsList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getStoredAsSubDirectories() {
        return software.amazon.jsii.Kernel.get(this, "storedAsSubDirectories", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptor getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptor.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_glue_catalog_table.DataAwsGlueCatalogTableStorageDescriptor value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
