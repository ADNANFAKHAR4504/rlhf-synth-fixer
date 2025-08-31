package imports.aws.data_aws_quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.806Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsQuicksightDataSet.DataAwsQuicksightDataSetLogicalTableMapDataTransformsOutputReference")
public class DataAwsQuicksightDataSetLogicalTableMapDataTransformsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsQuicksightDataSetLogicalTableMapDataTransformsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsQuicksightDataSetLogicalTableMapDataTransformsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsQuicksightDataSetLogicalTableMapDataTransformsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationList getCastColumnTypeOperation() {
        return software.amazon.jsii.Kernel.get(this, "castColumnTypeOperation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationList getCreateColumnsOperation() {
        return software.amazon.jsii.Kernel.get(this, "createColumnsOperation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsFilterOperationList getFilterOperation() {
        return software.amazon.jsii.Kernel.get(this, "filterOperation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsFilterOperationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsProjectOperationList getProjectOperation() {
        return software.amazon.jsii.Kernel.get(this, "projectOperation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsProjectOperationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationList getRenameColumnOperation() {
        return software.amazon.jsii.Kernel.get(this, "renameColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationList getTagColumnOperation() {
        return software.amazon.jsii.Kernel.get(this, "tagColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationList getUntagColumnOperation() {
        return software.amazon.jsii.Kernel.get(this, "untagColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperationList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransforms getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransforms.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapDataTransforms value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
