package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointMongodbSettingsOutputReference")
public class DmsEndpointMongodbSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DmsEndpointMongodbSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsEndpointMongodbSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DmsEndpointMongodbSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuthMechanism() {
        software.amazon.jsii.Kernel.call(this, "resetAuthMechanism", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthSource() {
        software.amazon.jsii.Kernel.call(this, "resetAuthSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthType() {
        software.amazon.jsii.Kernel.call(this, "resetAuthType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocsToInvestigate() {
        software.amazon.jsii.Kernel.call(this, "resetDocsToInvestigate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExtractDocId() {
        software.amazon.jsii.Kernel.call(this, "resetExtractDocId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNestingLevel() {
        software.amazon.jsii.Kernel.call(this, "resetNestingLevel", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthMechanismInput() {
        return software.amazon.jsii.Kernel.get(this, "authMechanismInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "authSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "authTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocsToInvestigateInput() {
        return software.amazon.jsii.Kernel.get(this, "docsToInvestigateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExtractDocIdInput() {
        return software.amazon.jsii.Kernel.get(this, "extractDocIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNestingLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "nestingLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthMechanism() {
        return software.amazon.jsii.Kernel.get(this, "authMechanism", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthMechanism(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authMechanism", java.util.Objects.requireNonNull(value, "authMechanism is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthSource() {
        return software.amazon.jsii.Kernel.get(this, "authSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authSource", java.util.Objects.requireNonNull(value, "authSource is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthType() {
        return software.amazon.jsii.Kernel.get(this, "authType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authType", java.util.Objects.requireNonNull(value, "authType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocsToInvestigate() {
        return software.amazon.jsii.Kernel.get(this, "docsToInvestigate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocsToInvestigate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "docsToInvestigate", java.util.Objects.requireNonNull(value, "docsToInvestigate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExtractDocId() {
        return software.amazon.jsii.Kernel.get(this, "extractDocId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExtractDocId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "extractDocId", java.util.Objects.requireNonNull(value, "extractDocId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNestingLevel() {
        return software.amazon.jsii.Kernel.get(this, "nestingLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNestingLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nestingLevel", java.util.Objects.requireNonNull(value, "nestingLevel is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointMongodbSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointMongodbSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointMongodbSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
