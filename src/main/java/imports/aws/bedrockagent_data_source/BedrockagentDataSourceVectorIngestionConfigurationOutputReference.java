package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.168Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationOutputReference")
public class BedrockagentDataSourceVectorIngestionConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentDataSourceVectorIngestionConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentDataSourceVectorIngestionConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentDataSourceVectorIngestionConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putChunkingConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putChunkingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomTransformationConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomTransformationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putParsingConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putParsingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetChunkingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetChunkingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomTransformationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCustomTransformationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParsingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetParsingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationList getChunkingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "chunkingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationList getCustomTransformationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "customTransformationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationList getParsingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "parsingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getChunkingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "chunkingConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomTransformationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "customTransformationConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getParsingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "parsingConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
