package imports.aws.data_aws_imagebuilder_image_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.695Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsImagebuilderImageRecipe.DataAwsImagebuilderImageRecipeBlockDeviceMappingOutputReference")
public class DataAwsImagebuilderImageRecipeBlockDeviceMappingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsImagebuilderImageRecipeBlockDeviceMappingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsImagebuilderImageRecipeBlockDeviceMappingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsImagebuilderImageRecipeBlockDeviceMappingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceName() {
        return software.amazon.jsii.Kernel.get(this, "deviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_imagebuilder_image_recipe.DataAwsImagebuilderImageRecipeBlockDeviceMappingEbsList getEbs() {
        return software.amazon.jsii.Kernel.get(this, "ebs", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_imagebuilder_image_recipe.DataAwsImagebuilderImageRecipeBlockDeviceMappingEbsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNoDevice() {
        return software.amazon.jsii.Kernel.get(this, "noDevice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVirtualName() {
        return software.amazon.jsii.Kernel.get(this, "virtualName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_imagebuilder_image_recipe.DataAwsImagebuilderImageRecipeBlockDeviceMapping getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_imagebuilder_image_recipe.DataAwsImagebuilderImageRecipeBlockDeviceMapping.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_imagebuilder_image_recipe.DataAwsImagebuilderImageRecipeBlockDeviceMapping value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
