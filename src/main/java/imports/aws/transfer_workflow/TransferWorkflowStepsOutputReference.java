package imports.aws.transfer_workflow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.571Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferWorkflow.TransferWorkflowStepsOutputReference")
public class TransferWorkflowStepsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TransferWorkflowStepsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferWorkflowStepsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public TransferWorkflowStepsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCopyStepDetails(final @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsCopyStepDetails value) {
        software.amazon.jsii.Kernel.call(this, "putCopyStepDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomStepDetails(final @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsCustomStepDetails value) {
        software.amazon.jsii.Kernel.call(this, "putCustomStepDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDecryptStepDetails(final @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsDecryptStepDetails value) {
        software.amazon.jsii.Kernel.call(this, "putDecryptStepDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDeleteStepDetails(final @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsDeleteStepDetails value) {
        software.amazon.jsii.Kernel.call(this, "putDeleteStepDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTagStepDetails(final @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsTagStepDetails value) {
        software.amazon.jsii.Kernel.call(this, "putTagStepDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCopyStepDetails() {
        software.amazon.jsii.Kernel.call(this, "resetCopyStepDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomStepDetails() {
        software.amazon.jsii.Kernel.call(this, "resetCustomStepDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDecryptStepDetails() {
        software.amazon.jsii.Kernel.call(this, "resetDecryptStepDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteStepDetails() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteStepDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagStepDetails() {
        software.amazon.jsii.Kernel.call(this, "resetTagStepDetails", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsCopyStepDetailsOutputReference getCopyStepDetails() {
        return software.amazon.jsii.Kernel.get(this, "copyStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsCopyStepDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsCustomStepDetailsOutputReference getCustomStepDetails() {
        return software.amazon.jsii.Kernel.get(this, "customStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsCustomStepDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsDecryptStepDetailsOutputReference getDecryptStepDetails() {
        return software.amazon.jsii.Kernel.get(this, "decryptStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsDecryptStepDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsDeleteStepDetailsOutputReference getDeleteStepDetails() {
        return software.amazon.jsii.Kernel.get(this, "deleteStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsDeleteStepDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowStepsTagStepDetailsOutputReference getTagStepDetails() {
        return software.amazon.jsii.Kernel.get(this, "tagStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsTagStepDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowStepsCopyStepDetails getCopyStepDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "copyStepDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsCopyStepDetails.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowStepsCustomStepDetails getCustomStepDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "customStepDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsCustomStepDetails.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowStepsDecryptStepDetails getDecryptStepDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "decryptStepDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsDecryptStepDetails.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowStepsDeleteStepDetails getDeleteStepDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteStepDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsDeleteStepDetails.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowStepsTagStepDetails getTagStepDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "tagStepDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowStepsTagStepDetails.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowSteps value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
