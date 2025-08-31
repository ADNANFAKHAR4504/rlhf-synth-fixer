package imports.aws.networkfirewall_tls_inspection_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.962Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationOutputReference")
public class NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCheckCertificateRevocationStatus(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus> __cast_cd4240 = (java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCheckCertificateRevocationStatus", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScope(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope> __cast_cd4240 = (java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putScope", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putServerCertificate(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate> __cast_cd4240 = (java.util.List<imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putServerCertificate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCertificateAuthorityArn() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateAuthorityArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCheckCertificateRevocationStatus() {
        software.amazon.jsii.Kernel.call(this, "resetCheckCertificateRevocationStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScope() {
        software.amazon.jsii.Kernel.call(this, "resetScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerCertificate() {
        software.amazon.jsii.Kernel.call(this, "resetServerCertificate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatusList getCheckCertificateRevocationStatus() {
        return software.amazon.jsii.Kernel.get(this, "checkCertificateRevocationStatus", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatusList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScopeList getScope() {
        return software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScopeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificateList getServerCertificate() {
        return software.amazon.jsii.Kernel.get(this, "serverCertificate", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificateList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateAuthorityArnInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateAuthorityArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCheckCertificateRevocationStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "checkCertificateRevocationStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "scopeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getServerCertificateInput() {
        return software.amazon.jsii.Kernel.get(this, "serverCertificateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateAuthorityArn() {
        return software.amazon.jsii.Kernel.get(this, "certificateAuthorityArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateAuthorityArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateAuthorityArn", java.util.Objects.requireNonNull(value, "certificateAuthorityArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
