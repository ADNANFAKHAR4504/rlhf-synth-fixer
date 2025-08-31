package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference")
public class QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLeftJoinKeyProperties(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties value) {
        software.amazon.jsii.Kernel.call(this, "putLeftJoinKeyProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRightJoinKeyProperties(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties value) {
        software.amazon.jsii.Kernel.call(this, "putRightJoinKeyProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetLeftJoinKeyProperties() {
        software.amazon.jsii.Kernel.call(this, "resetLeftJoinKeyProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRightJoinKeyProperties() {
        software.amazon.jsii.Kernel.call(this, "resetRightJoinKeyProperties", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesOutputReference getLeftJoinKeyProperties() {
        return software.amazon.jsii.Kernel.get(this, "leftJoinKeyProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesOutputReference getRightJoinKeyProperties() {
        return software.amazon.jsii.Kernel.get(this, "rightJoinKeyProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties getLeftJoinKeyPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "leftJoinKeyPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLeftOperandInput() {
        return software.amazon.jsii.Kernel.get(this, "leftOperandInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnClauseInput() {
        return software.amazon.jsii.Kernel.get(this, "onClauseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties getRightJoinKeyPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "rightJoinKeyPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRightOperandInput() {
        return software.amazon.jsii.Kernel.get(this, "rightOperandInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLeftOperand() {
        return software.amazon.jsii.Kernel.get(this, "leftOperand", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLeftOperand(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "leftOperand", java.util.Objects.requireNonNull(value, "leftOperand is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnClause() {
        return software.amazon.jsii.Kernel.get(this, "onClause", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnClause(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onClause", java.util.Objects.requireNonNull(value, "onClause is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRightOperand() {
        return software.amazon.jsii.Kernel.get(this, "rightOperand", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRightOperand(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rightOperand", java.util.Objects.requireNonNull(value, "rightOperand is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
