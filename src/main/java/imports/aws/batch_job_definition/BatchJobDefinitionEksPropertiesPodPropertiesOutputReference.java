package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesOutputReference")
public class BatchJobDefinitionEksPropertiesPodPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchJobDefinitionEksPropertiesPodPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobDefinitionEksPropertiesPodPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BatchJobDefinitionEksPropertiesPodPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putContainers(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesContainers>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesContainers> __cast_cd4240 = (java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesContainers>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesContainers __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putContainers", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putImagePullSecret(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret> __cast_cd4240 = (java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putImagePullSecret", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInitContainers(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers> __cast_cd4240 = (java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInitContainers", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetadata(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata value) {
        software.amazon.jsii.Kernel.call(this, "putMetadata", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVolumes(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes> __cast_cd4240 = (java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVolumes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDnsPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetDnsPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostNetwork() {
        software.amazon.jsii.Kernel.call(this, "resetHostNetwork", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImagePullSecret() {
        software.amazon.jsii.Kernel.call(this, "resetImagePullSecret", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitContainers() {
        software.amazon.jsii.Kernel.call(this, "resetInitContainers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadata() {
        software.amazon.jsii.Kernel.call(this, "resetMetadata", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceAccountName() {
        software.amazon.jsii.Kernel.call(this, "resetServiceAccountName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShareProcessNamespace() {
        software.amazon.jsii.Kernel.call(this, "resetShareProcessNamespace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumes() {
        software.amazon.jsii.Kernel.call(this, "resetVolumes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesContainersList getContainers() {
        return software.amazon.jsii.Kernel.get(this, "containers", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesContainersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretList getImagePullSecret() {
        return software.amazon.jsii.Kernel.get(this, "imagePullSecret", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersList getInitContainers() {
        return software.amazon.jsii.Kernel.get(this, "initContainers", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadataOutputReference getMetadata() {
        return software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadataOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesList getVolumes() {
        return software.amazon.jsii.Kernel.get(this, "volumes", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContainersInput() {
        return software.amazon.jsii.Kernel.get(this, "containersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDnsPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "dnsPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHostNetworkInput() {
        return software.amazon.jsii.Kernel.get(this, "hostNetworkInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getImagePullSecretInput() {
        return software.amazon.jsii.Kernel.get(this, "imagePullSecretInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInitContainersInput() {
        return software.amazon.jsii.Kernel.get(this, "initContainersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata getMetadataInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceAccountNameInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccountNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getShareProcessNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "shareProcessNamespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVolumesInput() {
        return software.amazon.jsii.Kernel.get(this, "volumesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsPolicy() {
        return software.amazon.jsii.Kernel.get(this, "dnsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDnsPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dnsPolicy", java.util.Objects.requireNonNull(value, "dnsPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHostNetwork() {
        return software.amazon.jsii.Kernel.get(this, "hostNetwork", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHostNetwork(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "hostNetwork", java.util.Objects.requireNonNull(value, "hostNetwork is required"));
    }

    public void setHostNetwork(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "hostNetwork", java.util.Objects.requireNonNull(value, "hostNetwork is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccountName() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceAccountName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceAccountName", java.util.Objects.requireNonNull(value, "serviceAccountName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getShareProcessNamespace() {
        return software.amazon.jsii.Kernel.get(this, "shareProcessNamespace", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setShareProcessNamespace(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "shareProcessNamespace", java.util.Objects.requireNonNull(value, "shareProcessNamespace is required"));
    }

    public void setShareProcessNamespace(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "shareProcessNamespace", java.util.Objects.requireNonNull(value, "shareProcessNamespace is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
