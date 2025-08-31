package imports.aws.lakeformation_data_cells_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.484Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationDataCellsFilter.LakeformationDataCellsFilterTableDataRowFilterOutputReference")
public class LakeformationDataCellsFilterTableDataRowFilterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LakeformationDataCellsFilterTableDataRowFilterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LakeformationDataCellsFilterTableDataRowFilterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public LakeformationDataCellsFilterTableDataRowFilterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAllRowsWildcard(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterAllRowsWildcard>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterAllRowsWildcard> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterAllRowsWildcard>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterAllRowsWildcard __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAllRowsWildcard", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllRowsWildcard() {
        software.amazon.jsii.Kernel.call(this, "resetAllRowsWildcard", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterExpression() {
        software.amazon.jsii.Kernel.call(this, "resetFilterExpression", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterAllRowsWildcardList getAllRowsWildcard() {
        return software.amazon.jsii.Kernel.get(this, "allRowsWildcard", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterAllRowsWildcardList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllRowsWildcardInput() {
        return software.amazon.jsii.Kernel.get(this, "allRowsWildcardInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFilterExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "filterExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFilterExpression() {
        return software.amazon.jsii.Kernel.get(this, "filterExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFilterExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "filterExpression", java.util.Objects.requireNonNull(value, "filterExpression is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
