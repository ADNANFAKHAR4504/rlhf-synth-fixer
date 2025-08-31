package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.160Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationOutputReference")
public class BedrockagentDataSourceDataSourceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentDataSourceDataSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentDataSourceDataSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentDataSourceDataSourceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putConfluenceConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationConfluenceConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationConfluenceConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationConfluenceConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationConfluenceConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConfluenceConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Configuration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationS3Configuration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationS3Configuration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationS3Configuration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationS3Configuration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putS3Configuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSalesforceConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSalesforceConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSalesforceConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSalesforceConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSalesforceConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSalesforceConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSharePointConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSharePointConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWebConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfiguration> __cast_cd4240 = (java.util.List<imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWebConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConfluenceConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetConfluenceConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Configuration() {
        software.amazon.jsii.Kernel.call(this, "resetS3Configuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSalesforceConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSalesforceConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSharePointConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSharePointConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWebConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetWebConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationList getConfluenceConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "confluenceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationS3ConfigurationList getS3Configuration() {
        return software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationS3ConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationList getSalesforceConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "salesforceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationList getSharePointConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "sharePointConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfigurationList getWebConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "webConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfluenceConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "confluenceConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getS3ConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSalesforceConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "salesforceConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSharePointConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "sharePointConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWebConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "webConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
