package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.284Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTableStorageDescriptorOutputReference")
public class GlueCatalogTableStorageDescriptorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCatalogTableStorageDescriptorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCatalogTableStorageDescriptorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueCatalogTableStorageDescriptorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putColumns(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorColumns>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorColumns> __cast_cd4240 = (java.util.List<imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorColumns>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorColumns __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putColumns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSchemaReference(final @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReference value) {
        software.amazon.jsii.Kernel.call(this, "putSchemaReference", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSerDeInfo(final @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSerDeInfo value) {
        software.amazon.jsii.Kernel.call(this, "putSerDeInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSkewedInfo(final @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSkewedInfo value) {
        software.amazon.jsii.Kernel.call(this, "putSkewedInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSortColumns(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSortColumns>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSortColumns> __cast_cd4240 = (java.util.List<imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSortColumns>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSortColumns __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSortColumns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdditionalLocations() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalLocations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketColumns() {
        software.amazon.jsii.Kernel.call(this, "resetBucketColumns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColumns() {
        software.amazon.jsii.Kernel.call(this, "resetColumns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCompressed() {
        software.amazon.jsii.Kernel.call(this, "resetCompressed", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputFormat() {
        software.amazon.jsii.Kernel.call(this, "resetInputFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocation() {
        software.amazon.jsii.Kernel.call(this, "resetLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumberOfBuckets() {
        software.amazon.jsii.Kernel.call(this, "resetNumberOfBuckets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputFormat() {
        software.amazon.jsii.Kernel.call(this, "resetOutputFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchemaReference() {
        software.amazon.jsii.Kernel.call(this, "resetSchemaReference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSerDeInfo() {
        software.amazon.jsii.Kernel.call(this, "resetSerDeInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkewedInfo() {
        software.amazon.jsii.Kernel.call(this, "resetSkewedInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSortColumns() {
        software.amazon.jsii.Kernel.call(this, "resetSortColumns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStoredAsSubDirectories() {
        software.amazon.jsii.Kernel.call(this, "resetStoredAsSubDirectories", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorColumnsList getColumns() {
        return software.amazon.jsii.Kernel.get(this, "columns", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorColumnsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceOutputReference getSchemaReference() {
        return software.amazon.jsii.Kernel.get(this, "schemaReference", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSerDeInfoOutputReference getSerDeInfo() {
        return software.amazon.jsii.Kernel.get(this, "serDeInfo", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSerDeInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSkewedInfoOutputReference getSkewedInfo() {
        return software.amazon.jsii.Kernel.get(this, "skewedInfo", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSkewedInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSortColumnsList getSortColumns() {
        return software.amazon.jsii.Kernel.get(this, "sortColumns", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSortColumnsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdditionalLocationsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "additionalLocationsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getBucketColumnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "bucketColumnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getColumnsInput() {
        return software.amazon.jsii.Kernel.get(this, "columnsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCompressedInput() {
        return software.amazon.jsii.Kernel.get(this, "compressedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "inputFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "locationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfBucketsInput() {
        return software.amazon.jsii.Kernel.get(this, "numberOfBucketsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "outputFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReference getSchemaReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "schemaReferenceInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSerDeInfo getSerDeInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "serDeInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSerDeInfo.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSkewedInfo getSkewedInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "skewedInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSkewedInfo.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSortColumnsInput() {
        return software.amazon.jsii.Kernel.get(this, "sortColumnsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStoredAsSubDirectoriesInput() {
        return software.amazon.jsii.Kernel.get(this, "storedAsSubDirectoriesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdditionalLocations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "additionalLocations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdditionalLocations(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "additionalLocations", java.util.Objects.requireNonNull(value, "additionalLocations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getBucketColumns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "bucketColumns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setBucketColumns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "bucketColumns", java.util.Objects.requireNonNull(value, "bucketColumns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCompressed() {
        return software.amazon.jsii.Kernel.get(this, "compressed", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCompressed(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "compressed", java.util.Objects.requireNonNull(value, "compressed is required"));
    }

    public void setCompressed(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "compressed", java.util.Objects.requireNonNull(value, "compressed is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputFormat() {
        return software.amazon.jsii.Kernel.get(this, "inputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputFormat", java.util.Objects.requireNonNull(value, "inputFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocation() {
        return software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "location", java.util.Objects.requireNonNull(value, "location is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfBuckets() {
        return software.amazon.jsii.Kernel.get(this, "numberOfBuckets", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumberOfBuckets(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numberOfBuckets", java.util.Objects.requireNonNull(value, "numberOfBuckets is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputFormat() {
        return software.amazon.jsii.Kernel.get(this, "outputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputFormat", java.util.Objects.requireNonNull(value, "outputFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStoredAsSubDirectories() {
        return software.amazon.jsii.Kernel.get(this, "storedAsSubDirectories", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStoredAsSubDirectories(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "storedAsSubDirectories", java.util.Objects.requireNonNull(value, "storedAsSubDirectories is required"));
    }

    public void setStoredAsSubDirectories(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "storedAsSubDirectories", java.util.Objects.requireNonNull(value, "storedAsSubDirectories is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
