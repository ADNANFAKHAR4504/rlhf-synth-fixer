package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.331Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageOutputReference")
public class CodepipelineStageOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineStageOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineStageOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CodepipelineStageOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codepipeline.CodepipelineStageAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codepipeline.CodepipelineStageAction> __cast_cd4240 = (java.util.List<imports.aws.codepipeline.CodepipelineStageAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codepipeline.CodepipelineStageAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBeforeEntry(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageBeforeEntry value) {
        software.amazon.jsii.Kernel.call(this, "putBeforeEntry", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOnFailure(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnFailure value) {
        software.amazon.jsii.Kernel.call(this, "putOnFailure", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOnSuccess(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnSuccess value) {
        software.amazon.jsii.Kernel.call(this, "putOnSuccess", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBeforeEntry() {
        software.amazon.jsii.Kernel.call(this, "resetBeforeEntry", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnFailure() {
        software.amazon.jsii.Kernel.call(this, "resetOnFailure", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnSuccess() {
        software.amazon.jsii.Kernel.call(this, "resetOnSuccess", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageActionList getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageBeforeEntryOutputReference getBeforeEntry() {
        return software.amazon.jsii.Kernel.get(this, "beforeEntry", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageBeforeEntryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnFailureOutputReference getOnFailure() {
        return software.amazon.jsii.Kernel.get(this, "onFailure", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnSuccessOutputReference getOnSuccess() {
        return software.amazon.jsii.Kernel.get(this, "onSuccess", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnSuccessOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageBeforeEntry getBeforeEntryInput() {
        return software.amazon.jsii.Kernel.get(this, "beforeEntryInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageBeforeEntry.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailure getOnFailureInput() {
        return software.amazon.jsii.Kernel.get(this, "onFailureInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailure.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnSuccess getOnSuccessInput() {
        return software.amazon.jsii.Kernel.get(this, "onSuccessInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnSuccess.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStage value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
