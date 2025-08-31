package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.174Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationOutputReference")
public class BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putFieldMapping(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMapping>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMapping> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMapping>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMapping __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFieldMapping", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFieldMapping() {
        software.amazon.jsii.Kernel.call(this, "resetFieldMapping", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMappingList getFieldMapping() {
        return software.amazon.jsii.Kernel.get(this, "fieldMapping", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMappingList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCollectionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "collectionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFieldMappingInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldMappingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVectorIndexNameInput() {
        return software.amazon.jsii.Kernel.get(this, "vectorIndexNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCollectionArn() {
        return software.amazon.jsii.Kernel.get(this, "collectionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCollectionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "collectionArn", java.util.Objects.requireNonNull(value, "collectionArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVectorIndexName() {
        return software.amazon.jsii.Kernel.get(this, "vectorIndexName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVectorIndexName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vectorIndexName", java.util.Objects.requireNonNull(value, "vectorIndexName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
