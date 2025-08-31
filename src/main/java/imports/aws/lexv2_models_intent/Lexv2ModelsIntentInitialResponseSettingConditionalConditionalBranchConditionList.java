package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.762Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSettingConditionalConditionalBranchConditionList")
public class Lexv2ModelsIntentInitialResponseSettingConditionalConditionalBranchConditionList extends com.hashicorp.cdktf.ComplexList {

    protected Lexv2ModelsIntentInitialResponseSettingConditionalConditionalBranchConditionList(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsIntentInitialResponseSettingConditionalConditionalBranchConditionList(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param wrapsSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Lexv2ModelsIntentInitialResponseSettingConditionalConditionalBranchConditionList(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Boolean wrapsSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(wrapsSet, "wrapsSet is required") });
    }

    /**
     * @param index the index of the item to return. This parameter is required.
     */
    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingConditionalConditionalBranchConditionOutputReference get(final @org.jetbrains.annotations.NotNull java.lang.Number index) {
        return software.amazon.jsii.Kernel.call(this, "get", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingConditionalConditionalBranchConditionOutputReference.class), new Object[] { java.util.Objects.requireNonNull(index, "index is required") });
    }

    /**
     * The attribute on the parent resource this class is referencing.
     */
    @Override
    protected @org.jetbrains.annotations.NotNull java.lang.String getTerraformAttribute() {
        return software.amazon.jsii.Kernel.get(this, "terraformAttribute", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * The attribute on the parent resource this class is referencing.
     */
    @Override
    protected void setTerraformAttribute(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "terraformAttribute", java.util.Objects.requireNonNull(value, "terraformAttribute is required"));
    }

    /**
     * The parent resource.
     */
    @Override
    protected @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent getTerraformResource() {
        return software.amazon.jsii.Kernel.get(this, "terraformResource", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IInterpolatingParent.class));
    }

    /**
     * The parent resource.
     */
    @Override
    protected void setTerraformResource(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent value) {
        software.amazon.jsii.Kernel.set(this, "terraformResource", java.util.Objects.requireNonNull(value, "terraformResource is required"));
    }

    /**
     * whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
     */
    @Override
    protected @org.jetbrains.annotations.NotNull java.lang.Boolean getWrapsSet() {
        return software.amazon.jsii.Kernel.get(this, "wrapsSet", software.amazon.jsii.NativeType.forClass(java.lang.Boolean.class));
    }

    /**
     * whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
     */
    @Override
    protected void setWrapsSet(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "wrapsSet", java.util.Objects.requireNonNull(value, "wrapsSet is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingConditionalConditionalBranchCondition> value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
