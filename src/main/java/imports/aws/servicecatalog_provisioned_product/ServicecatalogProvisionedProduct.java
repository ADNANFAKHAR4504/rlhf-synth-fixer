package imports.aws.servicecatalog_provisioned_product;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product aws_servicecatalog_provisioned_product}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProvisionedProduct.ServicecatalogProvisionedProduct")
public class ServicecatalogProvisionedProduct extends com.hashicorp.cdktf.TerraformResource {

    protected ServicecatalogProvisionedProduct(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ServicecatalogProvisionedProduct(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProduct.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product aws_servicecatalog_provisioned_product} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ServicecatalogProvisionedProduct(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ServicecatalogProvisionedProduct resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ServicecatalogProvisionedProduct to import. This parameter is required.
     * @param importFromId The id of the existing ServicecatalogProvisionedProduct that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ServicecatalogProvisionedProduct to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProduct.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ServicecatalogProvisionedProduct resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ServicecatalogProvisionedProduct to import. This parameter is required.
     * @param importFromId The id of the existing ServicecatalogProvisionedProduct that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProduct.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putProvisioningParameters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductProvisioningParameters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductProvisioningParameters> __cast_cd4240 = (java.util.List<imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductProvisioningParameters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductProvisioningParameters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProvisioningParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStackSetProvisioningPreferences(final @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences value) {
        software.amazon.jsii.Kernel.call(this, "putStackSetProvisioningPreferences", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAcceptLanguage() {
        software.amazon.jsii.Kernel.call(this, "resetAcceptLanguage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIgnoreErrors() {
        software.amazon.jsii.Kernel.call(this, "resetIgnoreErrors", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationArns() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPathId() {
        software.amazon.jsii.Kernel.call(this, "resetPathId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPathName() {
        software.amazon.jsii.Kernel.call(this, "resetPathName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProductId() {
        software.amazon.jsii.Kernel.call(this, "resetProductId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProductName() {
        software.amazon.jsii.Kernel.call(this, "resetProductName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProvisioningArtifactId() {
        software.amazon.jsii.Kernel.call(this, "resetProvisioningArtifactId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProvisioningArtifactName() {
        software.amazon.jsii.Kernel.call(this, "resetProvisioningArtifactName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProvisioningParameters() {
        software.amazon.jsii.Kernel.call(this, "resetProvisioningParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetainPhysicalResources() {
        software.amazon.jsii.Kernel.call(this, "resetRetainPhysicalResources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStackSetProvisioningPreferences() {
        software.amazon.jsii.Kernel.call(this, "resetStackSetProvisioningPreferences", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCloudwatchDashboardNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "cloudwatchDashboardNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedTime() {
        return software.amazon.jsii.Kernel.get(this, "createdTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastProvisioningRecordId() {
        return software.amazon.jsii.Kernel.get(this, "lastProvisioningRecordId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastRecordId() {
        return software.amazon.jsii.Kernel.get(this, "lastRecordId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastSuccessfulProvisioningRecordId() {
        return software.amazon.jsii.Kernel.get(this, "lastSuccessfulProvisioningRecordId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLaunchRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "launchRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductOutputsList getOutputs() {
        return software.amazon.jsii.Kernel.get(this, "outputs", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductOutputsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductProvisioningParametersList getProvisioningParameters() {
        return software.amazon.jsii.Kernel.get(this, "provisioningParameters", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductProvisioningParametersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferencesOutputReference getStackSetProvisioningPreferences() {
        return software.amazon.jsii.Kernel.get(this, "stackSetProvisioningPreferences", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferencesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatusMessage() {
        return software.amazon.jsii.Kernel.get(this, "statusMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAcceptLanguageInput() {
        return software.amazon.jsii.Kernel.get(this, "acceptLanguageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIgnoreErrorsInput() {
        return software.amazon.jsii.Kernel.get(this, "ignoreErrorsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotificationArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "notificationArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPathIdInput() {
        return software.amazon.jsii.Kernel.get(this, "pathIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPathNameInput() {
        return software.amazon.jsii.Kernel.get(this, "pathNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProductIdInput() {
        return software.amazon.jsii.Kernel.get(this, "productIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProductNameInput() {
        return software.amazon.jsii.Kernel.get(this, "productNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProvisioningArtifactIdInput() {
        return software.amazon.jsii.Kernel.get(this, "provisioningArtifactIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProvisioningArtifactNameInput() {
        return software.amazon.jsii.Kernel.get(this, "provisioningArtifactNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProvisioningParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "provisioningParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRetainPhysicalResourcesInput() {
        return software.amazon.jsii.Kernel.get(this, "retainPhysicalResourcesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences getStackSetProvisioningPreferencesInput() {
        return software.amazon.jsii.Kernel.get(this, "stackSetProvisioningPreferencesInput", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAcceptLanguage() {
        return software.amazon.jsii.Kernel.get(this, "acceptLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAcceptLanguage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "acceptLanguage", java.util.Objects.requireNonNull(value, "acceptLanguage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIgnoreErrors() {
        return software.amazon.jsii.Kernel.get(this, "ignoreErrors", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIgnoreErrors(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ignoreErrors", java.util.Objects.requireNonNull(value, "ignoreErrors is required"));
    }

    public void setIgnoreErrors(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ignoreErrors", java.util.Objects.requireNonNull(value, "ignoreErrors is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNotificationArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "notificationArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNotificationArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "notificationArns", java.util.Objects.requireNonNull(value, "notificationArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPathId() {
        return software.amazon.jsii.Kernel.get(this, "pathId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPathId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pathId", java.util.Objects.requireNonNull(value, "pathId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPathName() {
        return software.amazon.jsii.Kernel.get(this, "pathName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPathName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pathName", java.util.Objects.requireNonNull(value, "pathName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProductId() {
        return software.amazon.jsii.Kernel.get(this, "productId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProductId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "productId", java.util.Objects.requireNonNull(value, "productId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProductName() {
        return software.amazon.jsii.Kernel.get(this, "productName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProductName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "productName", java.util.Objects.requireNonNull(value, "productName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProvisioningArtifactId() {
        return software.amazon.jsii.Kernel.get(this, "provisioningArtifactId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProvisioningArtifactId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "provisioningArtifactId", java.util.Objects.requireNonNull(value, "provisioningArtifactId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProvisioningArtifactName() {
        return software.amazon.jsii.Kernel.get(this, "provisioningArtifactName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProvisioningArtifactName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "provisioningArtifactName", java.util.Objects.requireNonNull(value, "provisioningArtifactName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRetainPhysicalResources() {
        return software.amazon.jsii.Kernel.get(this, "retainPhysicalResources", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRetainPhysicalResources(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "retainPhysicalResources", java.util.Objects.requireNonNull(value, "retainPhysicalResources is required"));
    }

    public void setRetainPhysicalResources(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "retainPhysicalResources", java.util.Objects.requireNonNull(value, "retainPhysicalResources is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProduct}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProduct> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#name ServicecatalogProvisionedProduct#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#name ServicecatalogProvisionedProduct#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#accept_language ServicecatalogProvisionedProduct#accept_language}.
         * <p>
         * @return {@code this}
         * @param acceptLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#accept_language ServicecatalogProvisionedProduct#accept_language}. This parameter is required.
         */
        public Builder acceptLanguage(final java.lang.String acceptLanguage) {
            this.config.acceptLanguage(acceptLanguage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#id ServicecatalogProvisionedProduct#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#id ServicecatalogProvisionedProduct#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#ignore_errors ServicecatalogProvisionedProduct#ignore_errors}.
         * <p>
         * @return {@code this}
         * @param ignoreErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#ignore_errors ServicecatalogProvisionedProduct#ignore_errors}. This parameter is required.
         */
        public Builder ignoreErrors(final java.lang.Boolean ignoreErrors) {
            this.config.ignoreErrors(ignoreErrors);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#ignore_errors ServicecatalogProvisionedProduct#ignore_errors}.
         * <p>
         * @return {@code this}
         * @param ignoreErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#ignore_errors ServicecatalogProvisionedProduct#ignore_errors}. This parameter is required.
         */
        public Builder ignoreErrors(final com.hashicorp.cdktf.IResolvable ignoreErrors) {
            this.config.ignoreErrors(ignoreErrors);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#notification_arns ServicecatalogProvisionedProduct#notification_arns}.
         * <p>
         * @return {@code this}
         * @param notificationArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#notification_arns ServicecatalogProvisionedProduct#notification_arns}. This parameter is required.
         */
        public Builder notificationArns(final java.util.List<java.lang.String> notificationArns) {
            this.config.notificationArns(notificationArns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#path_id ServicecatalogProvisionedProduct#path_id}.
         * <p>
         * @return {@code this}
         * @param pathId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#path_id ServicecatalogProvisionedProduct#path_id}. This parameter is required.
         */
        public Builder pathId(final java.lang.String pathId) {
            this.config.pathId(pathId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#path_name ServicecatalogProvisionedProduct#path_name}.
         * <p>
         * @return {@code this}
         * @param pathName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#path_name ServicecatalogProvisionedProduct#path_name}. This parameter is required.
         */
        public Builder pathName(final java.lang.String pathName) {
            this.config.pathName(pathName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#product_id ServicecatalogProvisionedProduct#product_id}.
         * <p>
         * @return {@code this}
         * @param productId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#product_id ServicecatalogProvisionedProduct#product_id}. This parameter is required.
         */
        public Builder productId(final java.lang.String productId) {
            this.config.productId(productId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#product_name ServicecatalogProvisionedProduct#product_name}.
         * <p>
         * @return {@code this}
         * @param productName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#product_name ServicecatalogProvisionedProduct#product_name}. This parameter is required.
         */
        public Builder productName(final java.lang.String productName) {
            this.config.productName(productName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_artifact_id ServicecatalogProvisionedProduct#provisioning_artifact_id}.
         * <p>
         * @return {@code this}
         * @param provisioningArtifactId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_artifact_id ServicecatalogProvisionedProduct#provisioning_artifact_id}. This parameter is required.
         */
        public Builder provisioningArtifactId(final java.lang.String provisioningArtifactId) {
            this.config.provisioningArtifactId(provisioningArtifactId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_artifact_name ServicecatalogProvisionedProduct#provisioning_artifact_name}.
         * <p>
         * @return {@code this}
         * @param provisioningArtifactName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_artifact_name ServicecatalogProvisionedProduct#provisioning_artifact_name}. This parameter is required.
         */
        public Builder provisioningArtifactName(final java.lang.String provisioningArtifactName) {
            this.config.provisioningArtifactName(provisioningArtifactName);
            return this;
        }

        /**
         * provisioning_parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_parameters ServicecatalogProvisionedProduct#provisioning_parameters}
         * <p>
         * @return {@code this}
         * @param provisioningParameters provisioning_parameters block. This parameter is required.
         */
        public Builder provisioningParameters(final com.hashicorp.cdktf.IResolvable provisioningParameters) {
            this.config.provisioningParameters(provisioningParameters);
            return this;
        }
        /**
         * provisioning_parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_parameters ServicecatalogProvisionedProduct#provisioning_parameters}
         * <p>
         * @return {@code this}
         * @param provisioningParameters provisioning_parameters block. This parameter is required.
         */
        public Builder provisioningParameters(final java.util.List<? extends imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductProvisioningParameters> provisioningParameters) {
            this.config.provisioningParameters(provisioningParameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#retain_physical_resources ServicecatalogProvisionedProduct#retain_physical_resources}.
         * <p>
         * @return {@code this}
         * @param retainPhysicalResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#retain_physical_resources ServicecatalogProvisionedProduct#retain_physical_resources}. This parameter is required.
         */
        public Builder retainPhysicalResources(final java.lang.Boolean retainPhysicalResources) {
            this.config.retainPhysicalResources(retainPhysicalResources);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#retain_physical_resources ServicecatalogProvisionedProduct#retain_physical_resources}.
         * <p>
         * @return {@code this}
         * @param retainPhysicalResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#retain_physical_resources ServicecatalogProvisionedProduct#retain_physical_resources}. This parameter is required.
         */
        public Builder retainPhysicalResources(final com.hashicorp.cdktf.IResolvable retainPhysicalResources) {
            this.config.retainPhysicalResources(retainPhysicalResources);
            return this;
        }

        /**
         * stack_set_provisioning_preferences block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#stack_set_provisioning_preferences ServicecatalogProvisionedProduct#stack_set_provisioning_preferences}
         * <p>
         * @return {@code this}
         * @param stackSetProvisioningPreferences stack_set_provisioning_preferences block. This parameter is required.
         */
        public Builder stackSetProvisioningPreferences(final imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences stackSetProvisioningPreferences) {
            this.config.stackSetProvisioningPreferences(stackSetProvisioningPreferences);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#tags ServicecatalogProvisionedProduct#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#tags ServicecatalogProvisionedProduct#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#tags_all ServicecatalogProvisionedProduct#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#tags_all ServicecatalogProvisionedProduct#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#timeouts ServicecatalogProvisionedProduct#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProduct}.
         */
        @Override
        public imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProduct build() {
            return new imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProduct(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
