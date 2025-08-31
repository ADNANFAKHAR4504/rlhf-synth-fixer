package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapOutputReference")
public class QuicksightDataSetPhysicalTableMapOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetPhysicalTableMapOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetPhysicalTableMapOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public QuicksightDataSetPhysicalTableMapOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCustomSql(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql value) {
        software.amazon.jsii.Kernel.call(this, "putCustomSql", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRelationalTable(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable value) {
        software.amazon.jsii.Kernel.call(this, "putRelationalTable", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Source(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source value) {
        software.amazon.jsii.Kernel.call(this, "putS3Source", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomSql() {
        software.amazon.jsii.Kernel.call(this, "resetCustomSql", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRelationalTable() {
        software.amazon.jsii.Kernel.call(this, "resetRelationalTable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Source() {
        software.amazon.jsii.Kernel.call(this, "resetS3Source", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSqlOutputReference getCustomSql() {
        return software.amazon.jsii.Kernel.get(this, "customSql", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSqlOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableOutputReference getRelationalTable() {
        return software.amazon.jsii.Kernel.get(this, "relationalTable", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTableOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceOutputReference getS3Source() {
        return software.amazon.jsii.Kernel.get(this, "s3Source", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql getCustomSqlInput() {
        return software.amazon.jsii.Kernel.get(this, "customSqlInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapCustomSql.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPhysicalTableMapIdInput() {
        return software.amazon.jsii.Kernel.get(this, "physicalTableMapIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable getRelationalTableInput() {
        return software.amazon.jsii.Kernel.get(this, "relationalTableInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapRelationalTable.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source getS3SourceInput() {
        return software.amazon.jsii.Kernel.get(this, "s3SourceInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3Source.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhysicalTableMapId() {
        return software.amazon.jsii.Kernel.get(this, "physicalTableMapId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPhysicalTableMapId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "physicalTableMapId", java.util.Objects.requireNonNull(value, "physicalTableMapId is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMap value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
