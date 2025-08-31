package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceOutputReference")
public class QuicksightDataSetLogicalTableMapSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetLogicalTableMapSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetLogicalTableMapSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetLogicalTableMapSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putJoinInstruction(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction value) {
        software.amazon.jsii.Kernel.call(this, "putJoinInstruction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataSetArn() {
        software.amazon.jsii.Kernel.call(this, "resetDataSetArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJoinInstruction() {
        software.amazon.jsii.Kernel.call(this, "resetJoinInstruction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPhysicalTableId() {
        software.amazon.jsii.Kernel.call(this, "resetPhysicalTableId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference getJoinInstruction() {
        return software.amazon.jsii.Kernel.get(this, "joinInstruction", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSetArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSetArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction getJoinInstructionInput() {
        return software.amazon.jsii.Kernel.get(this, "joinInstructionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPhysicalTableIdInput() {
        return software.amazon.jsii.Kernel.get(this, "physicalTableIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSetArn() {
        return software.amazon.jsii.Kernel.get(this, "dataSetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSetArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSetArn", java.util.Objects.requireNonNull(value, "dataSetArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhysicalTableId() {
        return software.amazon.jsii.Kernel.get(this, "physicalTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPhysicalTableId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "physicalTableId", java.util.Objects.requireNonNull(value, "physicalTableId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
