package imports.aws.vpclattice_resource_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.622Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationResourceConfigurationDefinitionOutputReference")
public class VpclatticeResourceConfigurationResourceConfigurationDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpclatticeResourceConfigurationResourceConfigurationDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpclatticeResourceConfigurationResourceConfigurationDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public VpclatticeResourceConfigurationResourceConfigurationDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putArnResource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionArnResource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionArnResource> __cast_cd4240 = (java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionArnResource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionArnResource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putArnResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDnsResource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource> __cast_cd4240 = (java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDnsResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIpResource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource> __cast_cd4240 = (java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putIpResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArnResource() {
        software.amazon.jsii.Kernel.call(this, "resetArnResource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDnsResource() {
        software.amazon.jsii.Kernel.call(this, "resetDnsResource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpResource() {
        software.amazon.jsii.Kernel.call(this, "resetIpResource", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionArnResourceList getArnResource() {
        return software.amazon.jsii.Kernel.get(this, "arnResource", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionArnResourceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResourceList getDnsResource() {
        return software.amazon.jsii.Kernel.get(this, "dnsResource", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResourceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResourceList getIpResource() {
        return software.amazon.jsii.Kernel.get(this, "ipResource", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResourceList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getArnResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "arnResourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDnsResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "dnsResourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIpResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "ipResourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
