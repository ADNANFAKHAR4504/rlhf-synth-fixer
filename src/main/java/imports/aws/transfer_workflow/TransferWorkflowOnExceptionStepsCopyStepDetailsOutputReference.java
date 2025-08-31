package imports.aws.transfer_workflow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.570Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferWorkflow.TransferWorkflowOnExceptionStepsCopyStepDetailsOutputReference")
public class TransferWorkflowOnExceptionStepsCopyStepDetailsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TransferWorkflowOnExceptionStepsCopyStepDetailsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferWorkflowOnExceptionStepsCopyStepDetailsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TransferWorkflowOnExceptionStepsCopyStepDetailsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDestinationFileLocation(final @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation value) {
        software.amazon.jsii.Kernel.call(this, "putDestinationFileLocation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDestinationFileLocation() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationFileLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverwriteExisting() {
        software.amazon.jsii.Kernel.call(this, "resetOverwriteExisting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceFileLocation() {
        software.amazon.jsii.Kernel.call(this, "resetSourceFileLocation", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationOutputReference getDestinationFileLocation() {
        return software.amazon.jsii.Kernel.get(this, "destinationFileLocation", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation getDestinationFileLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationFileLocationInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOverwriteExistingInput() {
        return software.amazon.jsii.Kernel.get(this, "overwriteExistingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceFileLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceFileLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOverwriteExisting() {
        return software.amazon.jsii.Kernel.get(this, "overwriteExisting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOverwriteExisting(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "overwriteExisting", java.util.Objects.requireNonNull(value, "overwriteExisting is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceFileLocation() {
        return software.amazon.jsii.Kernel.get(this, "sourceFileLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceFileLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceFileLocation", java.util.Objects.requireNonNull(value, "sourceFileLocation is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
