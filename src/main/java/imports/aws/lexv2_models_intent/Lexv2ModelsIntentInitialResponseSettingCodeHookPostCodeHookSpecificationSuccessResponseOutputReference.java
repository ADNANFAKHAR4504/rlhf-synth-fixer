package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.746Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseOutputReference")
public class Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putMessageGroup(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseMessageGroup>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseMessageGroup> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseMessageGroup>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseMessageGroup __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMessageGroup", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllowInterrupt() {
        software.amazon.jsii.Kernel.call(this, "resetAllowInterrupt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageGroup() {
        software.amazon.jsii.Kernel.call(this, "resetMessageGroup", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseMessageGroupList getMessageGroup() {
        return software.amazon.jsii.Kernel.get(this, "messageGroup", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponseMessageGroupList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowInterruptInput() {
        return software.amazon.jsii.Kernel.get(this, "allowInterruptInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMessageGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "messageGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowInterrupt() {
        return software.amazon.jsii.Kernel.get(this, "allowInterrupt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowInterrupt(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowInterrupt", java.util.Objects.requireNonNull(value, "allowInterrupt is required"));
    }

    public void setAllowInterrupt(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowInterrupt", java.util.Objects.requireNonNull(value, "allowInterrupt is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationSuccessResponse value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
