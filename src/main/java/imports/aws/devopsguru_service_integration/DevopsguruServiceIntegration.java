package imports.aws.devopsguru_service_integration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration aws_devopsguru_service_integration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.995Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devopsguruServiceIntegration.DevopsguruServiceIntegration")
public class DevopsguruServiceIntegration extends com.hashicorp.cdktf.TerraformResource {

    protected DevopsguruServiceIntegration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DevopsguruServiceIntegration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.devopsguru_service_integration.DevopsguruServiceIntegration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration aws_devopsguru_service_integration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DevopsguruServiceIntegration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration aws_devopsguru_service_integration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DevopsguruServiceIntegration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DevopsguruServiceIntegration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DevopsguruServiceIntegration to import. This parameter is required.
     * @param importFromId The id of the existing DevopsguruServiceIntegration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DevopsguruServiceIntegration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.devopsguru_service_integration.DevopsguruServiceIntegration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DevopsguruServiceIntegration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DevopsguruServiceIntegration to import. This parameter is required.
     * @param importFromId The id of the existing DevopsguruServiceIntegration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.devopsguru_service_integration.DevopsguruServiceIntegration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putKmsServerSideEncryption(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationKmsServerSideEncryption>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationKmsServerSideEncryption> __cast_cd4240 = (java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationKmsServerSideEncryption>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationKmsServerSideEncryption __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putKmsServerSideEncryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogsAnomalyDetection(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationLogsAnomalyDetection>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationLogsAnomalyDetection> __cast_cd4240 = (java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationLogsAnomalyDetection>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationLogsAnomalyDetection __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLogsAnomalyDetection", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOpsCenter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationOpsCenter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationOpsCenter> __cast_cd4240 = (java.util.List<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationOpsCenter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationOpsCenter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOpsCenter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetKmsServerSideEncryption() {
        software.amazon.jsii.Kernel.call(this, "resetKmsServerSideEncryption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogsAnomalyDetection() {
        software.amazon.jsii.Kernel.call(this, "resetLogsAnomalyDetection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpsCenter() {
        software.amazon.jsii.Kernel.call(this, "resetOpsCenter", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationKmsServerSideEncryptionList getKmsServerSideEncryption() {
        return software.amazon.jsii.Kernel.get(this, "kmsServerSideEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationKmsServerSideEncryptionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationLogsAnomalyDetectionList getLogsAnomalyDetection() {
        return software.amazon.jsii.Kernel.get(this, "logsAnomalyDetection", software.amazon.jsii.NativeType.forClass(imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationLogsAnomalyDetectionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationOpsCenterList getOpsCenter() {
        return software.amazon.jsii.Kernel.get(this, "opsCenter", software.amazon.jsii.NativeType.forClass(imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationOpsCenterList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKmsServerSideEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsServerSideEncryptionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogsAnomalyDetectionInput() {
        return software.amazon.jsii.Kernel.get(this, "logsAnomalyDetectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOpsCenterInput() {
        return software.amazon.jsii.Kernel.get(this, "opsCenterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    /**
     * A fluent builder for {@link imports.aws.devopsguru_service_integration.DevopsguruServiceIntegration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.devopsguru_service_integration.DevopsguruServiceIntegration> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * kms_server_side_encryption block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_server_side_encryption DevopsguruServiceIntegration#kms_server_side_encryption}
         * <p>
         * @return {@code this}
         * @param kmsServerSideEncryption kms_server_side_encryption block. This parameter is required.
         */
        public Builder kmsServerSideEncryption(final com.hashicorp.cdktf.IResolvable kmsServerSideEncryption) {
            this.config().kmsServerSideEncryption(kmsServerSideEncryption);
            return this;
        }
        /**
         * kms_server_side_encryption block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_server_side_encryption DevopsguruServiceIntegration#kms_server_side_encryption}
         * <p>
         * @return {@code this}
         * @param kmsServerSideEncryption kms_server_side_encryption block. This parameter is required.
         */
        public Builder kmsServerSideEncryption(final java.util.List<? extends imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationKmsServerSideEncryption> kmsServerSideEncryption) {
            this.config().kmsServerSideEncryption(kmsServerSideEncryption);
            return this;
        }

        /**
         * logs_anomaly_detection block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#logs_anomaly_detection DevopsguruServiceIntegration#logs_anomaly_detection}
         * <p>
         * @return {@code this}
         * @param logsAnomalyDetection logs_anomaly_detection block. This parameter is required.
         */
        public Builder logsAnomalyDetection(final com.hashicorp.cdktf.IResolvable logsAnomalyDetection) {
            this.config().logsAnomalyDetection(logsAnomalyDetection);
            return this;
        }
        /**
         * logs_anomaly_detection block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#logs_anomaly_detection DevopsguruServiceIntegration#logs_anomaly_detection}
         * <p>
         * @return {@code this}
         * @param logsAnomalyDetection logs_anomaly_detection block. This parameter is required.
         */
        public Builder logsAnomalyDetection(final java.util.List<? extends imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationLogsAnomalyDetection> logsAnomalyDetection) {
            this.config().logsAnomalyDetection(logsAnomalyDetection);
            return this;
        }

        /**
         * ops_center block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#ops_center DevopsguruServiceIntegration#ops_center}
         * <p>
         * @return {@code this}
         * @param opsCenter ops_center block. This parameter is required.
         */
        public Builder opsCenter(final com.hashicorp.cdktf.IResolvable opsCenter) {
            this.config().opsCenter(opsCenter);
            return this;
        }
        /**
         * ops_center block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#ops_center DevopsguruServiceIntegration#ops_center}
         * <p>
         * @return {@code this}
         * @param opsCenter ops_center block. This parameter is required.
         */
        public Builder opsCenter(final java.util.List<? extends imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationOpsCenter> opsCenter) {
            this.config().opsCenter(opsCenter);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.devopsguru_service_integration.DevopsguruServiceIntegration}.
         */
        @Override
        public imports.aws.devopsguru_service_integration.DevopsguruServiceIntegration build() {
            return new imports.aws.devopsguru_service_integration.DevopsguruServiceIntegration(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationConfig.Builder();
            }
            return this.config;
        }
    }
}
