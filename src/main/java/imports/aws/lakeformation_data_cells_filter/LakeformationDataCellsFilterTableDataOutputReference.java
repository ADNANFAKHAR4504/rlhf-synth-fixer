package imports.aws.lakeformation_data_cells_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.484Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationDataCellsFilter.LakeformationDataCellsFilterTableDataOutputReference")
public class LakeformationDataCellsFilterTableDataOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LakeformationDataCellsFilterTableDataOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LakeformationDataCellsFilterTableDataOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public LakeformationDataCellsFilterTableDataOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putColumnWildcard(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataColumnWildcard>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataColumnWildcard> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataColumnWildcard>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataColumnWildcard __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putColumnWildcard", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRowFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilter> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRowFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetColumnNames() {
        software.amazon.jsii.Kernel.call(this, "resetColumnNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColumnWildcard() {
        software.amazon.jsii.Kernel.call(this, "resetColumnWildcard", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRowFilter() {
        software.amazon.jsii.Kernel.call(this, "resetRowFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersionId() {
        software.amazon.jsii.Kernel.call(this, "resetVersionId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataColumnWildcardList getColumnWildcard() {
        return software.amazon.jsii.Kernel.get(this, "columnWildcard", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataColumnWildcardList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterList getRowFilter() {
        return software.amazon.jsii.Kernel.get(this, "rowFilter", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getColumnNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "columnNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getColumnWildcardInput() {
        return software.amazon.jsii.Kernel.get(this, "columnWildcardInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRowFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "rowFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableCatalogIdInput() {
        return software.amazon.jsii.Kernel.get(this, "tableCatalogIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableNameInput() {
        return software.amazon.jsii.Kernel.get(this, "tableNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "versionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getColumnNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "columnNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setColumnNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "columnNames", java.util.Objects.requireNonNull(value, "columnNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseName", java.util.Objects.requireNonNull(value, "databaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTableCatalogId() {
        return software.amazon.jsii.Kernel.get(this, "tableCatalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTableCatalogId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tableCatalogId", java.util.Objects.requireNonNull(value, "tableCatalogId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTableName() {
        return software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTableName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tableName", java.util.Objects.requireNonNull(value, "tableName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionId() {
        return software.amazon.jsii.Kernel.get(this, "versionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "versionId", java.util.Objects.requireNonNull(value, "versionId is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableData value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
