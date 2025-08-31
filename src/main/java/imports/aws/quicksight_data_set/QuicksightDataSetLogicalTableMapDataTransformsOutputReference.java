package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.107Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsOutputReference")
public class QuicksightDataSetLogicalTableMapDataTransformsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetLogicalTableMapDataTransformsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetLogicalTableMapDataTransformsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public QuicksightDataSetLogicalTableMapDataTransformsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCastColumnTypeOperation(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation value) {
        software.amazon.jsii.Kernel.call(this, "putCastColumnTypeOperation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCreateColumnsOperation(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation value) {
        software.amazon.jsii.Kernel.call(this, "putCreateColumnsOperation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilterOperation(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation value) {
        software.amazon.jsii.Kernel.call(this, "putFilterOperation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProjectOperation(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation value) {
        software.amazon.jsii.Kernel.call(this, "putProjectOperation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRenameColumnOperation(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation value) {
        software.amazon.jsii.Kernel.call(this, "putRenameColumnOperation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTagColumnOperation(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation value) {
        software.amazon.jsii.Kernel.call(this, "putTagColumnOperation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUntagColumnOperation(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation value) {
        software.amazon.jsii.Kernel.call(this, "putUntagColumnOperation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCastColumnTypeOperation() {
        software.amazon.jsii.Kernel.call(this, "resetCastColumnTypeOperation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreateColumnsOperation() {
        software.amazon.jsii.Kernel.call(this, "resetCreateColumnsOperation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterOperation() {
        software.amazon.jsii.Kernel.call(this, "resetFilterOperation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProjectOperation() {
        software.amazon.jsii.Kernel.call(this, "resetProjectOperation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRenameColumnOperation() {
        software.amazon.jsii.Kernel.call(this, "resetRenameColumnOperation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagColumnOperation() {
        software.amazon.jsii.Kernel.call(this, "resetTagColumnOperation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUntagColumnOperation() {
        software.amazon.jsii.Kernel.call(this, "resetUntagColumnOperation", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationOutputReference getCastColumnTypeOperation() {
        return software.amazon.jsii.Kernel.get(this, "castColumnTypeOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationOutputReference getCreateColumnsOperation() {
        return software.amazon.jsii.Kernel.get(this, "createColumnsOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperationOutputReference getFilterOperation() {
        return software.amazon.jsii.Kernel.get(this, "filterOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperationOutputReference getProjectOperation() {
        return software.amazon.jsii.Kernel.get(this, "projectOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference getRenameColumnOperation() {
        return software.amazon.jsii.Kernel.get(this, "renameColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationOutputReference getTagColumnOperation() {
        return software.amazon.jsii.Kernel.get(this, "tagColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationOutputReference getUntagColumnOperation() {
        return software.amazon.jsii.Kernel.get(this, "untagColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation getCastColumnTypeOperationInput() {
        return software.amazon.jsii.Kernel.get(this, "castColumnTypeOperationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation getCreateColumnsOperationInput() {
        return software.amazon.jsii.Kernel.get(this, "createColumnsOperationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation getFilterOperationInput() {
        return software.amazon.jsii.Kernel.get(this, "filterOperationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation getProjectOperationInput() {
        return software.amazon.jsii.Kernel.get(this, "projectOperationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation getRenameColumnOperationInput() {
        return software.amazon.jsii.Kernel.get(this, "renameColumnOperationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation getTagColumnOperationInput() {
        return software.amazon.jsii.Kernel.get(this, "tagColumnOperationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation getUntagColumnOperationInput() {
        return software.amazon.jsii.Kernel.get(this, "untagColumnOperationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransforms value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
