package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.174Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMappingOutputReference")
public class BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMappingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMappingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMappingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMappingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetMetadataField() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTextField() {
        software.amazon.jsii.Kernel.call(this, "resetTextField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVectorField() {
        software.amazon.jsii.Kernel.call(this, "resetVectorField", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetadataFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTextFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "textFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVectorFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "vectorFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetadataField() {
        return software.amazon.jsii.Kernel.get(this, "metadataField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetadataField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metadataField", java.util.Objects.requireNonNull(value, "metadataField is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTextField() {
        return software.amazon.jsii.Kernel.get(this, "textField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTextField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "textField", java.util.Objects.requireNonNull(value, "textField is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVectorField() {
        return software.amazon.jsii.Kernel.get(this, "vectorField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVectorField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vectorField", java.util.Objects.requireNonNull(value, "vectorField is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMapping value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
