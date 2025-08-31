package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.107Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference")
public class QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "columnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNewColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "newColumnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColumnName() {
        return software.amazon.jsii.Kernel.get(this, "columnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColumnName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "columnName", java.util.Objects.requireNonNull(value, "columnName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNewColumnName() {
        return software.amazon.jsii.Kernel.get(this, "newColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNewColumnName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "newColumnName", java.util.Objects.requireNonNull(value, "newColumnName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
