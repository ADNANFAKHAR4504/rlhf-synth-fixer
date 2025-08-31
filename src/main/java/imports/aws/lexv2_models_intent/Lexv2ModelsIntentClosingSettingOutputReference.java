package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.568Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentClosingSettingOutputReference")
public class Lexv2ModelsIntentClosingSettingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsIntentClosingSettingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsIntentClosingSettingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsIntentClosingSettingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putClosingResponse(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingClosingResponse>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingClosingResponse> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingClosingResponse>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingClosingResponse __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putClosingResponse", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putConditional(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditional>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditional> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditional>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditional __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConditional", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNextStep(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingNextStep>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingNextStep> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingNextStep>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingNextStep __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNextStep", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActive() {
        software.amazon.jsii.Kernel.call(this, "resetActive", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClosingResponse() {
        software.amazon.jsii.Kernel.call(this, "resetClosingResponse", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConditional() {
        software.amazon.jsii.Kernel.call(this, "resetConditional", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNextStep() {
        software.amazon.jsii.Kernel.call(this, "resetNextStep", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingClosingResponseList getClosingResponse() {
        return software.amazon.jsii.Kernel.get(this, "closingResponse", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingClosingResponseList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalList getConditional() {
        return software.amazon.jsii.Kernel.get(this, "conditional", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingNextStepList getNextStep() {
        return software.amazon.jsii.Kernel.get(this, "nextStep", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingNextStepList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getActiveInput() {
        return software.amazon.jsii.Kernel.get(this, "activeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getClosingResponseInput() {
        return software.amazon.jsii.Kernel.get(this, "closingResponseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConditionalInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNextStepInput() {
        return software.amazon.jsii.Kernel.get(this, "nextStepInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getActive() {
        return software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setActive(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "active", java.util.Objects.requireNonNull(value, "active is required"));
    }

    public void setActive(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "active", java.util.Objects.requireNonNull(value, "active is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSetting value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
