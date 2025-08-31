package imports.aws.data_aws_quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.807Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsQuicksightDataSet.DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference")
public class DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesList getLeftJoinKeyProperties() {
        return software.amazon.jsii.Kernel.get(this, "leftJoinKeyProperties", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLeftOperand() {
        return software.amazon.jsii.Kernel.get(this, "leftOperand", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnClause() {
        return software.amazon.jsii.Kernel.get(this, "onClause", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesList getRightJoinKeyProperties() {
        return software.amazon.jsii.Kernel.get(this, "rightJoinKeyProperties", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRightOperand() {
        return software.amazon.jsii.Kernel.get(this, "rightOperand", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstruction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstruction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_quicksight_data_set.DataAwsQuicksightDataSetLogicalTableMapSourceJoinInstruction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
