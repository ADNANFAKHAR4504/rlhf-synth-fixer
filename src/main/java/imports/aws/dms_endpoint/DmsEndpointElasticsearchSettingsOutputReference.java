package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointElasticsearchSettingsOutputReference")
public class DmsEndpointElasticsearchSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DmsEndpointElasticsearchSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsEndpointElasticsearchSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DmsEndpointElasticsearchSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetErrorRetryDuration() {
        software.amazon.jsii.Kernel.call(this, "resetErrorRetryDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFullLoadErrorPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetFullLoadErrorPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseNewMappingType() {
        software.amazon.jsii.Kernel.call(this, "resetUseNewMappingType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointUriInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getErrorRetryDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "errorRetryDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFullLoadErrorPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "fullLoadErrorPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseNewMappingTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "useNewMappingTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointUri() {
        return software.amazon.jsii.Kernel.get(this, "endpointUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointUri", java.util.Objects.requireNonNull(value, "endpointUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getErrorRetryDuration() {
        return software.amazon.jsii.Kernel.get(this, "errorRetryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setErrorRetryDuration(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "errorRetryDuration", java.util.Objects.requireNonNull(value, "errorRetryDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFullLoadErrorPercentage() {
        return software.amazon.jsii.Kernel.get(this, "fullLoadErrorPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFullLoadErrorPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fullLoadErrorPercentage", java.util.Objects.requireNonNull(value, "fullLoadErrorPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceAccessRoleArn", java.util.Objects.requireNonNull(value, "serviceAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseNewMappingType() {
        return software.amazon.jsii.Kernel.get(this, "useNewMappingType", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseNewMappingType(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useNewMappingType", java.util.Objects.requireNonNull(value, "useNewMappingType is required"));
    }

    public void setUseNewMappingType(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useNewMappingType", java.util.Objects.requireNonNull(value, "useNewMappingType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
