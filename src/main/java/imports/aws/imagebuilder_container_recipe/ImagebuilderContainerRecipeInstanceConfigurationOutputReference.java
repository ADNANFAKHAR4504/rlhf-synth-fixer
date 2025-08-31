package imports.aws.imagebuilder_container_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.349Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeInstanceConfigurationOutputReference")
public class ImagebuilderContainerRecipeInstanceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderContainerRecipeInstanceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderContainerRecipeInstanceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderContainerRecipeInstanceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBlockDeviceMapping(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfigurationBlockDeviceMapping>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfigurationBlockDeviceMapping> __cast_cd4240 = (java.util.List<imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfigurationBlockDeviceMapping>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfigurationBlockDeviceMapping __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBlockDeviceMapping", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBlockDeviceMapping() {
        software.amazon.jsii.Kernel.call(this, "resetBlockDeviceMapping", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImage() {
        software.amazon.jsii.Kernel.call(this, "resetImage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfigurationBlockDeviceMappingList getBlockDeviceMapping() {
        return software.amazon.jsii.Kernel.get(this, "blockDeviceMapping", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfigurationBlockDeviceMappingList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBlockDeviceMappingInput() {
        return software.amazon.jsii.Kernel.get(this, "blockDeviceMappingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageInput() {
        return software.amazon.jsii.Kernel.get(this, "imageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImage() {
        return software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "image", java.util.Objects.requireNonNull(value, "image is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
