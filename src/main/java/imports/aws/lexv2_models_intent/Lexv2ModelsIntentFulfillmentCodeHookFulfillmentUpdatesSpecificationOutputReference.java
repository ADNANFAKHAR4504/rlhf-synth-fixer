package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.665Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationOutputReference")
public class Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putStartResponse(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationStartResponse>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationStartResponse> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationStartResponse>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationStartResponse __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStartResponse", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUpdateResponse(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUpdateResponse", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetStartResponse() {
        software.amazon.jsii.Kernel.call(this, "resetStartResponse", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdateResponse() {
        software.amazon.jsii.Kernel.call(this, "resetUpdateResponse", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationStartResponseList getStartResponse() {
        return software.amazon.jsii.Kernel.get(this, "startResponse", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationStartResponseList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponseList getUpdateResponse() {
        return software.amazon.jsii.Kernel.get(this, "updateResponse", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponseList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getActiveInput() {
        return software.amazon.jsii.Kernel.get(this, "activeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStartResponseInput() {
        return software.amazon.jsii.Kernel.get(this, "startResponseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUpdateResponseInput() {
        return software.amazon.jsii.Kernel.get(this, "updateResponseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutInSeconds", java.util.Objects.requireNonNull(value, "timeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
