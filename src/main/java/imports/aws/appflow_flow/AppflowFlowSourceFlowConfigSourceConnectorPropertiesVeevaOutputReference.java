package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeevaOutputReference")
public class AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeevaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeevaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeevaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeevaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDocumentType() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeAllVersions() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeAllVersions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeRenditions() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeRenditions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeSourceFiles() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeSourceFiles", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocumentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "documentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeAllVersionsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeAllVersionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeRenditionsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeRenditionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSourceFilesInput() {
        return software.amazon.jsii.Kernel.get(this, "includeSourceFilesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectInput() {
        return software.amazon.jsii.Kernel.get(this, "objectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentType() {
        return software.amazon.jsii.Kernel.get(this, "documentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocumentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "documentType", java.util.Objects.requireNonNull(value, "documentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeAllVersions() {
        return software.amazon.jsii.Kernel.get(this, "includeAllVersions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeAllVersions(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeAllVersions", java.util.Objects.requireNonNull(value, "includeAllVersions is required"));
    }

    public void setIncludeAllVersions(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeAllVersions", java.util.Objects.requireNonNull(value, "includeAllVersions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeRenditions() {
        return software.amazon.jsii.Kernel.get(this, "includeRenditions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeRenditions(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeRenditions", java.util.Objects.requireNonNull(value, "includeRenditions is required"));
    }

    public void setIncludeRenditions(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeRenditions", java.util.Objects.requireNonNull(value, "includeRenditions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeSourceFiles() {
        return software.amazon.jsii.Kernel.get(this, "includeSourceFiles", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeSourceFiles(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeSourceFiles", java.util.Objects.requireNonNull(value, "includeSourceFiles is required"));
    }

    public void setIncludeSourceFiles(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeSourceFiles", java.util.Objects.requireNonNull(value, "includeSourceFiles is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObject() {
        return software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObject(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "object", java.util.Objects.requireNonNull(value, "object is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesVeeva value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
