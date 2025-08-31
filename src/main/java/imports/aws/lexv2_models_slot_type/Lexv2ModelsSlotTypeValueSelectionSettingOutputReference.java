package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.816Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingOutputReference")
public class Lexv2ModelsSlotTypeValueSelectionSettingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsSlotTypeValueSelectionSettingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsSlotTypeValueSelectionSettingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsSlotTypeValueSelectionSettingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAdvancedRecognitionSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAdvancedRecognitionSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRegexFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRegexFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdvancedRecognitionSetting() {
        software.amazon.jsii.Kernel.call(this, "resetAdvancedRecognitionSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegexFilter() {
        software.amazon.jsii.Kernel.call(this, "resetRegexFilter", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingList getAdvancedRecognitionSetting() {
        return software.amazon.jsii.Kernel.get(this, "advancedRecognitionSetting", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterList getRegexFilter() {
        return software.amazon.jsii.Kernel.get(this, "regexFilter", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAdvancedRecognitionSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedRecognitionSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRegexFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "regexFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResolutionStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "resolutionStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResolutionStrategy() {
        return software.amazon.jsii.Kernel.get(this, "resolutionStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResolutionStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resolutionStrategy", java.util.Objects.requireNonNull(value, "resolutionStrategy is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSetting value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
