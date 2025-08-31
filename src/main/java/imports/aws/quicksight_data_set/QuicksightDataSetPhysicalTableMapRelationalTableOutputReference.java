package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapRelationalTableOutputReference")
public class QuicksightDataSetPhysicalTableMapRelationalTableOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetPhysicalTableMapRelationalTableOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetPhysicalTableMapRelationalTableOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetPhysicalTableMapRelationalTableOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putInputColumns(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableInputColumns>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableInputColumns> __cast_cd4240 = (java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableInputColumns>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableInputColumns __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInputColumns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCatalog() {
        software.amazon.jsii.Kernel.call(this, "resetCatalog", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchema() {
        software.amazon.jsii.Kernel.call(this, "resetSchema", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsList getInputColumns() {
        return software.amazon.jsii.Kernel.get(this, "inputColumns", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableInputColumnsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCatalogInput() {
        return software.amazon.jsii.Kernel.get(this, "catalogInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInputColumnsInput() {
        return software.amazon.jsii.Kernel.get(this, "inputColumnsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "schemaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCatalog() {
        return software.amazon.jsii.Kernel.get(this, "catalog", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCatalog(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "catalog", java.util.Objects.requireNonNull(value, "catalog is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSourceArn() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSourceArn", java.util.Objects.requireNonNull(value, "dataSourceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSchema() {
        return software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSchema(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "schema", java.util.Objects.requireNonNull(value, "schema is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
