package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.560Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationOutputReference")
public class Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCustomPayload(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationCustomPayload>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationCustomPayload> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationCustomPayload>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationCustomPayload __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomPayload", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putImageResponseCard(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationImageResponseCard>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationImageResponseCard> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationImageResponseCard>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationImageResponseCard __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putImageResponseCard", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlainTextMessage(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationPlainTextMessage>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationPlainTextMessage> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationPlainTextMessage>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationPlainTextMessage __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlainTextMessage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSsmlMessage(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationSsmlMessage>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationSsmlMessage> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationSsmlMessage>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationSsmlMessage __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSsmlMessage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomPayload() {
        software.amazon.jsii.Kernel.call(this, "resetCustomPayload", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageResponseCard() {
        software.amazon.jsii.Kernel.call(this, "resetImageResponseCard", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlainTextMessage() {
        software.amazon.jsii.Kernel.call(this, "resetPlainTextMessage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSsmlMessage() {
        software.amazon.jsii.Kernel.call(this, "resetSsmlMessage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationCustomPayloadList getCustomPayload() {
        return software.amazon.jsii.Kernel.get(this, "customPayload", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationCustomPayloadList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationImageResponseCardList getImageResponseCard() {
        return software.amazon.jsii.Kernel.get(this, "imageResponseCard", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationImageResponseCardList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationPlainTextMessageList getPlainTextMessage() {
        return software.amazon.jsii.Kernel.get(this, "plainTextMessage", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationPlainTextMessageList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationSsmlMessageList getSsmlMessage() {
        return software.amazon.jsii.Kernel.get(this, "ssmlMessage", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariationSsmlMessageList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomPayloadInput() {
        return software.amazon.jsii.Kernel.get(this, "customPayloadInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getImageResponseCardInput() {
        return software.amazon.jsii.Kernel.get(this, "imageResponseCardInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPlainTextMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "plainTextMessageInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSsmlMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "ssmlMessageInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditionalConditionalBranchResponseMessageGroupVariation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
