package imports.aws.imagebuilder_image_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.361Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImageRecipe.ImagebuilderImageRecipeSystemsManagerAgentOutputReference")
public class ImagebuilderImageRecipeSystemsManagerAgentOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderImageRecipeSystemsManagerAgentOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderImageRecipeSystemsManagerAgentOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderImageRecipeSystemsManagerAgentOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUninstallAfterBuildInput() {
        return software.amazon.jsii.Kernel.get(this, "uninstallAfterBuildInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUninstallAfterBuild() {
        return software.amazon.jsii.Kernel.get(this, "uninstallAfterBuild", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUninstallAfterBuild(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "uninstallAfterBuild", java.util.Objects.requireNonNull(value, "uninstallAfterBuild is required"));
    }

    public void setUninstallAfterBuild(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "uninstallAfterBuild", java.util.Objects.requireNonNull(value, "uninstallAfterBuild is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeSystemsManagerAgent value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
