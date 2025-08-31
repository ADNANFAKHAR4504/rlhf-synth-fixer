package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.796Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotValueElicitationSettingOutputReference")
public class Lexv2ModelsSlotValueElicitationSettingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsSlotValueElicitationSettingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsSlotValueElicitationSettingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsSlotValueElicitationSettingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDefaultValueSpecification(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingDefaultValueSpecification>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingDefaultValueSpecification> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingDefaultValueSpecification>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingDefaultValueSpecification __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDefaultValueSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPromptSpecification(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecification>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecification> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecification>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecification __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPromptSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSampleUtterance(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSampleUtterance>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSampleUtterance> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSampleUtterance>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSampleUtterance __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSampleUtterance", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSlotResolutionSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSlotResolutionSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWaitAndContinueSpecification(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingWaitAndContinueSpecification>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingWaitAndContinueSpecification> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingWaitAndContinueSpecification>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingWaitAndContinueSpecification __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWaitAndContinueSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDefaultValueSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultValueSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPromptSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetPromptSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSampleUtterance() {
        software.amazon.jsii.Kernel.call(this, "resetSampleUtterance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSlotResolutionSetting() {
        software.amazon.jsii.Kernel.call(this, "resetSlotResolutionSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitAndContinueSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetWaitAndContinueSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingDefaultValueSpecificationList getDefaultValueSpecification() {
        return software.amazon.jsii.Kernel.get(this, "defaultValueSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingDefaultValueSpecificationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecificationList getPromptSpecification() {
        return software.amazon.jsii.Kernel.get(this, "promptSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecificationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSampleUtteranceList getSampleUtterance() {
        return software.amazon.jsii.Kernel.get(this, "sampleUtterance", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSampleUtteranceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSettingList getSlotResolutionSetting() {
        return software.amazon.jsii.Kernel.get(this, "slotResolutionSetting", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSettingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingWaitAndContinueSpecificationList getWaitAndContinueSpecification() {
        return software.amazon.jsii.Kernel.get(this, "waitAndContinueSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingWaitAndContinueSpecificationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDefaultValueSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultValueSpecificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPromptSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "promptSpecificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSampleUtteranceInput() {
        return software.amazon.jsii.Kernel.get(this, "sampleUtteranceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSlotConstraintInput() {
        return software.amazon.jsii.Kernel.get(this, "slotConstraintInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSlotResolutionSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "slotResolutionSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWaitAndContinueSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "waitAndContinueSpecificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlotConstraint() {
        return software.amazon.jsii.Kernel.get(this, "slotConstraint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSlotConstraint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "slotConstraint", java.util.Objects.requireNonNull(value, "slotConstraint is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSetting value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
