package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.253Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxOntapVolumeSnaplockConfiguration.Jsii$Proxy.class)
public interface FsxOntapVolumeSnaplockConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_type FsxOntapVolume#snaplock_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSnaplockType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#audit_log_volume FsxOntapVolume#audit_log_volume}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAuditLogVolume() {
        return null;
    }

    /**
     * autocommit_period block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#autocommit_period FsxOntapVolume#autocommit_period}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod getAutocommitPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#privileged_delete FsxOntapVolume#privileged_delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivilegedDelete() {
        return null;
    }

    /**
     * retention_period block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#retention_period FsxOntapVolume#retention_period}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod getRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_append_mode_enabled FsxOntapVolume#volume_append_mode_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVolumeAppendModeEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOntapVolumeSnaplockConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOntapVolumeSnaplockConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOntapVolumeSnaplockConfiguration> {
        java.lang.String snaplockType;
        java.lang.Object auditLogVolume;
        imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod autocommitPeriod;
        java.lang.String privilegedDelete;
        imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod retentionPeriod;
        java.lang.Object volumeAppendModeEnabled;

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfiguration#getSnaplockType}
         * @param snaplockType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_type FsxOntapVolume#snaplock_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder snaplockType(java.lang.String snaplockType) {
            this.snaplockType = snaplockType;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfiguration#getAuditLogVolume}
         * @param auditLogVolume Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#audit_log_volume FsxOntapVolume#audit_log_volume}.
         * @return {@code this}
         */
        public Builder auditLogVolume(java.lang.Boolean auditLogVolume) {
            this.auditLogVolume = auditLogVolume;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfiguration#getAuditLogVolume}
         * @param auditLogVolume Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#audit_log_volume FsxOntapVolume#audit_log_volume}.
         * @return {@code this}
         */
        public Builder auditLogVolume(com.hashicorp.cdktf.IResolvable auditLogVolume) {
            this.auditLogVolume = auditLogVolume;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfiguration#getAutocommitPeriod}
         * @param autocommitPeriod autocommit_period block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#autocommit_period FsxOntapVolume#autocommit_period}
         * @return {@code this}
         */
        public Builder autocommitPeriod(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod autocommitPeriod) {
            this.autocommitPeriod = autocommitPeriod;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfiguration#getPrivilegedDelete}
         * @param privilegedDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#privileged_delete FsxOntapVolume#privileged_delete}.
         * @return {@code this}
         */
        public Builder privilegedDelete(java.lang.String privilegedDelete) {
            this.privilegedDelete = privilegedDelete;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfiguration#getRetentionPeriod}
         * @param retentionPeriod retention_period block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#retention_period FsxOntapVolume#retention_period}
         * @return {@code this}
         */
        public Builder retentionPeriod(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod retentionPeriod) {
            this.retentionPeriod = retentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfiguration#getVolumeAppendModeEnabled}
         * @param volumeAppendModeEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_append_mode_enabled FsxOntapVolume#volume_append_mode_enabled}.
         * @return {@code this}
         */
        public Builder volumeAppendModeEnabled(java.lang.Boolean volumeAppendModeEnabled) {
            this.volumeAppendModeEnabled = volumeAppendModeEnabled;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfiguration#getVolumeAppendModeEnabled}
         * @param volumeAppendModeEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_append_mode_enabled FsxOntapVolume#volume_append_mode_enabled}.
         * @return {@code this}
         */
        public Builder volumeAppendModeEnabled(com.hashicorp.cdktf.IResolvable volumeAppendModeEnabled) {
            this.volumeAppendModeEnabled = volumeAppendModeEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOntapVolumeSnaplockConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOntapVolumeSnaplockConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOntapVolumeSnaplockConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOntapVolumeSnaplockConfiguration {
        private final java.lang.String snaplockType;
        private final java.lang.Object auditLogVolume;
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod autocommitPeriod;
        private final java.lang.String privilegedDelete;
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod retentionPeriod;
        private final java.lang.Object volumeAppendModeEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.snaplockType = software.amazon.jsii.Kernel.get(this, "snaplockType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.auditLogVolume = software.amazon.jsii.Kernel.get(this, "auditLogVolume", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autocommitPeriod = software.amazon.jsii.Kernel.get(this, "autocommitPeriod", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod.class));
            this.privilegedDelete = software.amazon.jsii.Kernel.get(this, "privilegedDelete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retentionPeriod = software.amazon.jsii.Kernel.get(this, "retentionPeriod", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod.class));
            this.volumeAppendModeEnabled = software.amazon.jsii.Kernel.get(this, "volumeAppendModeEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.snaplockType = java.util.Objects.requireNonNull(builder.snaplockType, "snaplockType is required");
            this.auditLogVolume = builder.auditLogVolume;
            this.autocommitPeriod = builder.autocommitPeriod;
            this.privilegedDelete = builder.privilegedDelete;
            this.retentionPeriod = builder.retentionPeriod;
            this.volumeAppendModeEnabled = builder.volumeAppendModeEnabled;
        }

        @Override
        public final java.lang.String getSnaplockType() {
            return this.snaplockType;
        }

        @Override
        public final java.lang.Object getAuditLogVolume() {
            return this.auditLogVolume;
        }

        @Override
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod getAutocommitPeriod() {
            return this.autocommitPeriod;
        }

        @Override
        public final java.lang.String getPrivilegedDelete() {
            return this.privilegedDelete;
        }

        @Override
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod getRetentionPeriod() {
            return this.retentionPeriod;
        }

        @Override
        public final java.lang.Object getVolumeAppendModeEnabled() {
            return this.volumeAppendModeEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("snaplockType", om.valueToTree(this.getSnaplockType()));
            if (this.getAuditLogVolume() != null) {
                data.set("auditLogVolume", om.valueToTree(this.getAuditLogVolume()));
            }
            if (this.getAutocommitPeriod() != null) {
                data.set("autocommitPeriod", om.valueToTree(this.getAutocommitPeriod()));
            }
            if (this.getPrivilegedDelete() != null) {
                data.set("privilegedDelete", om.valueToTree(this.getPrivilegedDelete()));
            }
            if (this.getRetentionPeriod() != null) {
                data.set("retentionPeriod", om.valueToTree(this.getRetentionPeriod()));
            }
            if (this.getVolumeAppendModeEnabled() != null) {
                data.set("volumeAppendModeEnabled", om.valueToTree(this.getVolumeAppendModeEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOntapVolumeSnaplockConfiguration.Jsii$Proxy that = (FsxOntapVolumeSnaplockConfiguration.Jsii$Proxy) o;

            if (!snaplockType.equals(that.snaplockType)) return false;
            if (this.auditLogVolume != null ? !this.auditLogVolume.equals(that.auditLogVolume) : that.auditLogVolume != null) return false;
            if (this.autocommitPeriod != null ? !this.autocommitPeriod.equals(that.autocommitPeriod) : that.autocommitPeriod != null) return false;
            if (this.privilegedDelete != null ? !this.privilegedDelete.equals(that.privilegedDelete) : that.privilegedDelete != null) return false;
            if (this.retentionPeriod != null ? !this.retentionPeriod.equals(that.retentionPeriod) : that.retentionPeriod != null) return false;
            return this.volumeAppendModeEnabled != null ? this.volumeAppendModeEnabled.equals(that.volumeAppendModeEnabled) : that.volumeAppendModeEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.snaplockType.hashCode();
            result = 31 * result + (this.auditLogVolume != null ? this.auditLogVolume.hashCode() : 0);
            result = 31 * result + (this.autocommitPeriod != null ? this.autocommitPeriod.hashCode() : 0);
            result = 31 * result + (this.privilegedDelete != null ? this.privilegedDelete.hashCode() : 0);
            result = 31 * result + (this.retentionPeriod != null ? this.retentionPeriod.hashCode() : 0);
            result = 31 * result + (this.volumeAppendModeEnabled != null ? this.volumeAppendModeEnabled.hashCode() : 0);
            return result;
        }
    }
}
