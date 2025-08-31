package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.644Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingElicitationCodeHookOutputReference")
public class Lexv2ModelsIntentConfirmationSettingElicitationCodeHookOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsIntentConfirmationSettingElicitationCodeHookOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsIntentConfirmationSettingElicitationCodeHookOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsIntentConfirmationSettingElicitationCodeHookOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEnableCodeHookInvocation() {
        software.amazon.jsii.Kernel.call(this, "resetEnableCodeHookInvocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInvocationLabel() {
        software.amazon.jsii.Kernel.call(this, "resetInvocationLabel", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableCodeHookInvocationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableCodeHookInvocationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInvocationLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "invocationLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableCodeHookInvocation() {
        return software.amazon.jsii.Kernel.get(this, "enableCodeHookInvocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableCodeHookInvocation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableCodeHookInvocation", java.util.Objects.requireNonNull(value, "enableCodeHookInvocation is required"));
    }

    public void setEnableCodeHookInvocation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableCodeHookInvocation", java.util.Objects.requireNonNull(value, "enableCodeHookInvocation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInvocationLabel() {
        return software.amazon.jsii.Kernel.get(this, "invocationLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInvocationLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "invocationLabel", java.util.Objects.requireNonNull(value, "invocationLabel is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingElicitationCodeHook value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
