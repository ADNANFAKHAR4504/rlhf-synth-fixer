package imports.aws.servicecatalog_product;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProduct.ServicecatalogProductProvisioningArtifactParametersOutputReference")
public class ServicecatalogProductProvisioningArtifactParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ServicecatalogProductProvisioningArtifactParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ServicecatalogProductProvisioningArtifactParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ServicecatalogProductProvisioningArtifactParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableTemplateValidation() {
        software.amazon.jsii.Kernel.call(this, "resetDisableTemplateValidation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplatePhysicalId() {
        software.amazon.jsii.Kernel.call(this, "resetTemplatePhysicalId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplateUrl() {
        software.amazon.jsii.Kernel.call(this, "resetTemplateUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableTemplateValidationInput() {
        return software.amazon.jsii.Kernel.get(this, "disableTemplateValidationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplatePhysicalIdInput() {
        return software.amazon.jsii.Kernel.get(this, "templatePhysicalIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplateUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "templateUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableTemplateValidation() {
        return software.amazon.jsii.Kernel.get(this, "disableTemplateValidation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableTemplateValidation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableTemplateValidation", java.util.Objects.requireNonNull(value, "disableTemplateValidation is required"));
    }

    public void setDisableTemplateValidation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableTemplateValidation", java.util.Objects.requireNonNull(value, "disableTemplateValidation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplatePhysicalId() {
        return software.amazon.jsii.Kernel.get(this, "templatePhysicalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplatePhysicalId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templatePhysicalId", java.util.Objects.requireNonNull(value, "templatePhysicalId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplateUrl() {
        return software.amazon.jsii.Kernel.get(this, "templateUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplateUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templateUrl", java.util.Objects.requireNonNull(value, "templateUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
