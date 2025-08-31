package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.131Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference")
public class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putEnv(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv> __cast_cd4240 = (java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEnv", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResources(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources value) {
        software.amazon.jsii.Kernel.call(this, "putResources", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSecurityContext(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext value) {
        software.amazon.jsii.Kernel.call(this, "putSecurityContext", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVolumeMounts(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts> __cast_cd4240 = (java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVolumeMounts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArgs() {
        software.amazon.jsii.Kernel.call(this, "resetArgs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCommand() {
        software.amazon.jsii.Kernel.call(this, "resetCommand", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnv() {
        software.amazon.jsii.Kernel.call(this, "resetEnv", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImagePullPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetImagePullPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResources() {
        software.amazon.jsii.Kernel.call(this, "resetResources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityContext() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeMounts() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeMounts", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvList getEnv() {
        return software.amazon.jsii.Kernel.get(this, "env", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResourcesOutputReference getResources() {
        return software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResourcesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference getSecurityContext() {
        return software.amazon.jsii.Kernel.get(this, "securityContext", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsList getVolumeMounts() {
        return software.amazon.jsii.Kernel.get(this, "volumeMounts", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getArgsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "argsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommandInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "commandInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnvInput() {
        return software.amazon.jsii.Kernel.get(this, "envInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageInput() {
        return software.amazon.jsii.Kernel.get(this, "imageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImagePullPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "imagePullPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources getResourcesInput() {
        return software.amazon.jsii.Kernel.get(this, "resourcesInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext getSecurityContextInput() {
        return software.amazon.jsii.Kernel.get(this, "securityContextInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVolumeMountsInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeMountsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getArgs() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "args", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setArgs(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "args", java.util.Objects.requireNonNull(value, "args is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCommand() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCommand(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "command", java.util.Objects.requireNonNull(value, "command is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImage() {
        return software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "image", java.util.Objects.requireNonNull(value, "image is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImagePullPolicy() {
        return software.amazon.jsii.Kernel.get(this, "imagePullPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImagePullPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imagePullPolicy", java.util.Objects.requireNonNull(value, "imagePullPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
