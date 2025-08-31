package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.167Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationOutputReference")
public class BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putFixedSizeChunkingConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFixedSizeChunkingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHierarchicalChunkingConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putHierarchicalChunkingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSemanticChunkingConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSemanticChunkingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFixedSizeChunkingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetFixedSizeChunkingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHierarchicalChunkingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetHierarchicalChunkingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSemanticChunkingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSemanticChunkingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfigurationList getFixedSizeChunkingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "fixedSizeChunkingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfigurationList getHierarchicalChunkingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "hierarchicalChunkingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfigurationList getSemanticChunkingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "semanticChunkingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getChunkingStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "chunkingStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFixedSizeChunkingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "fixedSizeChunkingConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHierarchicalChunkingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "hierarchicalChunkingConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSemanticChunkingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "semanticChunkingConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getChunkingStrategy() {
        return software.amazon.jsii.Kernel.get(this, "chunkingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setChunkingStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "chunkingStrategy", java.util.Objects.requireNonNull(value, "chunkingStrategy is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
