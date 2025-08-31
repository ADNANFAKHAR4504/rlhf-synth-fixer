package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingConfirmationConditionalDefaultBranchNextStepIntentSlotValueOutputReference")
public class Lexv2ModelsIntentConfirmationSettingConfirmationConditionalDefaultBranchNextStepIntentSlotValueOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsIntentConfirmationSettingConfirmationConditionalDefaultBranchNextStepIntentSlotValueOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsIntentConfirmationSettingConfirmationConditionalDefaultBranchNextStepIntentSlotValueOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsIntentConfirmationSettingConfirmationConditionalDefaultBranchNextStepIntentSlotValueOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetInterpretedValue() {
        software.amazon.jsii.Kernel.call(this, "resetInterpretedValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInterpretedValueInput() {
        return software.amazon.jsii.Kernel.get(this, "interpretedValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInterpretedValue() {
        return software.amazon.jsii.Kernel.get(this, "interpretedValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInterpretedValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "interpretedValue", java.util.Objects.requireNonNull(value, "interpretedValue is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingConfirmationConditionalDefaultBranchNextStepIntentSlotValue value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
