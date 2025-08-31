package imports.aws.lex_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.546Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexIntent.LexIntentSlotOutputReference")
public class LexIntentSlotOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LexIntentSlotOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LexIntentSlotOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public LexIntentSlotOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putValueElicitationPrompt(final @org.jetbrains.annotations.NotNull imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt value) {
        software.amazon.jsii.Kernel.call(this, "putValueElicitationPrompt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPriority() {
        software.amazon.jsii.Kernel.call(this, "resetPriority", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponseCard() {
        software.amazon.jsii.Kernel.call(this, "resetResponseCard", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSampleUtterances() {
        software.amazon.jsii.Kernel.call(this, "resetSampleUtterances", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSlotTypeVersion() {
        software.amazon.jsii.Kernel.call(this, "resetSlotTypeVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValueElicitationPrompt() {
        software.amazon.jsii.Kernel.call(this, "resetValueElicitationPrompt", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lex_intent.LexIntentSlotValueElicitationPromptOutputReference getValueElicitationPrompt() {
        return software.amazon.jsii.Kernel.get(this, "valueElicitationPrompt", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentSlotValueElicitationPromptOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPriorityInput() {
        return software.amazon.jsii.Kernel.get(this, "priorityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResponseCardInput() {
        return software.amazon.jsii.Kernel.get(this, "responseCardInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSampleUtterancesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "sampleUtterancesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSlotConstraintInput() {
        return software.amazon.jsii.Kernel.get(this, "slotConstraintInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSlotTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "slotTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSlotTypeVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "slotTypeVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt getValueElicitationPromptInput() {
        return software.amazon.jsii.Kernel.get(this, "valueElicitationPromptInput", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPriority() {
        return software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPriority(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "priority", java.util.Objects.requireNonNull(value, "priority is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResponseCard() {
        return software.amazon.jsii.Kernel.get(this, "responseCard", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResponseCard(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "responseCard", java.util.Objects.requireNonNull(value, "responseCard is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSampleUtterances() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "sampleUtterances", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSampleUtterances(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "sampleUtterances", java.util.Objects.requireNonNull(value, "sampleUtterances is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlotConstraint() {
        return software.amazon.jsii.Kernel.get(this, "slotConstraint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSlotConstraint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "slotConstraint", java.util.Objects.requireNonNull(value, "slotConstraint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlotType() {
        return software.amazon.jsii.Kernel.get(this, "slotType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSlotType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "slotType", java.util.Objects.requireNonNull(value, "slotType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlotTypeVersion() {
        return software.amazon.jsii.Kernel.get(this, "slotTypeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSlotTypeVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "slotTypeVersion", java.util.Objects.requireNonNull(value, "slotTypeVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentSlot value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
