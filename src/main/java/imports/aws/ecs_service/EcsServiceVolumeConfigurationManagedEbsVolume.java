package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.133Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceVolumeConfigurationManagedEbsVolume")
@software.amazon.jsii.Jsii.Proxy(EcsServiceVolumeConfigurationManagedEbsVolume.Jsii$Proxy.class)
public interface EcsServiceVolumeConfigurationManagedEbsVolume extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#role_arn EcsService#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#encrypted EcsService#encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#file_system_type EcsService#file_system_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileSystemType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#iops EcsService#iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#kms_key_id EcsService#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#size_in_gb EcsService#size_in_gb}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSizeInGb() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#snapshot_id EcsService#snapshot_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotId() {
        return null;
    }

    /**
     * tag_specifications block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tag_specifications EcsService#tag_specifications}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTagSpecifications() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#throughput EcsService#throughput}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThroughput() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#volume_initialization_rate EcsService#volume_initialization_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVolumeInitializationRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#volume_type EcsService#volume_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsServiceVolumeConfigurationManagedEbsVolume}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceVolumeConfigurationManagedEbsVolume}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceVolumeConfigurationManagedEbsVolume> {
        java.lang.String roleArn;
        java.lang.Object encrypted;
        java.lang.String fileSystemType;
        java.lang.Number iops;
        java.lang.String kmsKeyId;
        java.lang.Number sizeInGb;
        java.lang.String snapshotId;
        java.lang.Object tagSpecifications;
        java.lang.Number throughput;
        java.lang.Number volumeInitializationRate;
        java.lang.String volumeType;

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#role_arn EcsService#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#encrypted EcsService#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.Boolean encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#encrypted EcsService#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(com.hashicorp.cdktf.IResolvable encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getFileSystemType}
         * @param fileSystemType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#file_system_type EcsService#file_system_type}.
         * @return {@code this}
         */
        public Builder fileSystemType(java.lang.String fileSystemType) {
            this.fileSystemType = fileSystemType;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getIops}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#iops EcsService#iops}.
         * @return {@code this}
         */
        public Builder iops(java.lang.Number iops) {
            this.iops = iops;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#kms_key_id EcsService#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getSizeInGb}
         * @param sizeInGb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#size_in_gb EcsService#size_in_gb}.
         * @return {@code this}
         */
        public Builder sizeInGb(java.lang.Number sizeInGb) {
            this.sizeInGb = sizeInGb;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getSnapshotId}
         * @param snapshotId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#snapshot_id EcsService#snapshot_id}.
         * @return {@code this}
         */
        public Builder snapshotId(java.lang.String snapshotId) {
            this.snapshotId = snapshotId;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getTagSpecifications}
         * @param tagSpecifications tag_specifications block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tag_specifications EcsService#tag_specifications}
         * @return {@code this}
         */
        public Builder tagSpecifications(com.hashicorp.cdktf.IResolvable tagSpecifications) {
            this.tagSpecifications = tagSpecifications;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getTagSpecifications}
         * @param tagSpecifications tag_specifications block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tag_specifications EcsService#tag_specifications}
         * @return {@code this}
         */
        public Builder tagSpecifications(java.util.List<? extends imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeTagSpecifications> tagSpecifications) {
            this.tagSpecifications = tagSpecifications;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getThroughput}
         * @param throughput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#throughput EcsService#throughput}.
         * @return {@code this}
         */
        public Builder throughput(java.lang.Number throughput) {
            this.throughput = throughput;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getVolumeInitializationRate}
         * @param volumeInitializationRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#volume_initialization_rate EcsService#volume_initialization_rate}.
         * @return {@code this}
         */
        public Builder volumeInitializationRate(java.lang.Number volumeInitializationRate) {
            this.volumeInitializationRate = volumeInitializationRate;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfigurationManagedEbsVolume#getVolumeType}
         * @param volumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#volume_type EcsService#volume_type}.
         * @return {@code this}
         */
        public Builder volumeType(java.lang.String volumeType) {
            this.volumeType = volumeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceVolumeConfigurationManagedEbsVolume}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceVolumeConfigurationManagedEbsVolume build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceVolumeConfigurationManagedEbsVolume}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceVolumeConfigurationManagedEbsVolume {
        private final java.lang.String roleArn;
        private final java.lang.Object encrypted;
        private final java.lang.String fileSystemType;
        private final java.lang.Number iops;
        private final java.lang.String kmsKeyId;
        private final java.lang.Number sizeInGb;
        private final java.lang.String snapshotId;
        private final java.lang.Object tagSpecifications;
        private final java.lang.Number throughput;
        private final java.lang.Number volumeInitializationRate;
        private final java.lang.String volumeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fileSystemType = software.amazon.jsii.Kernel.get(this, "fileSystemType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iops = software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sizeInGb = software.amazon.jsii.Kernel.get(this, "sizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.snapshotId = software.amazon.jsii.Kernel.get(this, "snapshotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagSpecifications = software.amazon.jsii.Kernel.get(this, "tagSpecifications", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.throughput = software.amazon.jsii.Kernel.get(this, "throughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.volumeInitializationRate = software.amazon.jsii.Kernel.get(this, "volumeInitializationRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.volumeType = software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.encrypted = builder.encrypted;
            this.fileSystemType = builder.fileSystemType;
            this.iops = builder.iops;
            this.kmsKeyId = builder.kmsKeyId;
            this.sizeInGb = builder.sizeInGb;
            this.snapshotId = builder.snapshotId;
            this.tagSpecifications = builder.tagSpecifications;
            this.throughput = builder.throughput;
            this.volumeInitializationRate = builder.volumeInitializationRate;
            this.volumeType = builder.volumeType;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getEncrypted() {
            return this.encrypted;
        }

        @Override
        public final java.lang.String getFileSystemType() {
            return this.fileSystemType;
        }

        @Override
        public final java.lang.Number getIops() {
            return this.iops;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Number getSizeInGb() {
            return this.sizeInGb;
        }

        @Override
        public final java.lang.String getSnapshotId() {
            return this.snapshotId;
        }

        @Override
        public final java.lang.Object getTagSpecifications() {
            return this.tagSpecifications;
        }

        @Override
        public final java.lang.Number getThroughput() {
            return this.throughput;
        }

        @Override
        public final java.lang.Number getVolumeInitializationRate() {
            return this.volumeInitializationRate;
        }

        @Override
        public final java.lang.String getVolumeType() {
            return this.volumeType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getEncrypted() != null) {
                data.set("encrypted", om.valueToTree(this.getEncrypted()));
            }
            if (this.getFileSystemType() != null) {
                data.set("fileSystemType", om.valueToTree(this.getFileSystemType()));
            }
            if (this.getIops() != null) {
                data.set("iops", om.valueToTree(this.getIops()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getSizeInGb() != null) {
                data.set("sizeInGb", om.valueToTree(this.getSizeInGb()));
            }
            if (this.getSnapshotId() != null) {
                data.set("snapshotId", om.valueToTree(this.getSnapshotId()));
            }
            if (this.getTagSpecifications() != null) {
                data.set("tagSpecifications", om.valueToTree(this.getTagSpecifications()));
            }
            if (this.getThroughput() != null) {
                data.set("throughput", om.valueToTree(this.getThroughput()));
            }
            if (this.getVolumeInitializationRate() != null) {
                data.set("volumeInitializationRate", om.valueToTree(this.getVolumeInitializationRate()));
            }
            if (this.getVolumeType() != null) {
                data.set("volumeType", om.valueToTree(this.getVolumeType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceVolumeConfigurationManagedEbsVolume"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceVolumeConfigurationManagedEbsVolume.Jsii$Proxy that = (EcsServiceVolumeConfigurationManagedEbsVolume.Jsii$Proxy) o;

            if (!roleArn.equals(that.roleArn)) return false;
            if (this.encrypted != null ? !this.encrypted.equals(that.encrypted) : that.encrypted != null) return false;
            if (this.fileSystemType != null ? !this.fileSystemType.equals(that.fileSystemType) : that.fileSystemType != null) return false;
            if (this.iops != null ? !this.iops.equals(that.iops) : that.iops != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.sizeInGb != null ? !this.sizeInGb.equals(that.sizeInGb) : that.sizeInGb != null) return false;
            if (this.snapshotId != null ? !this.snapshotId.equals(that.snapshotId) : that.snapshotId != null) return false;
            if (this.tagSpecifications != null ? !this.tagSpecifications.equals(that.tagSpecifications) : that.tagSpecifications != null) return false;
            if (this.throughput != null ? !this.throughput.equals(that.throughput) : that.throughput != null) return false;
            if (this.volumeInitializationRate != null ? !this.volumeInitializationRate.equals(that.volumeInitializationRate) : that.volumeInitializationRate != null) return false;
            return this.volumeType != null ? this.volumeType.equals(that.volumeType) : that.volumeType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.roleArn.hashCode();
            result = 31 * result + (this.encrypted != null ? this.encrypted.hashCode() : 0);
            result = 31 * result + (this.fileSystemType != null ? this.fileSystemType.hashCode() : 0);
            result = 31 * result + (this.iops != null ? this.iops.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.sizeInGb != null ? this.sizeInGb.hashCode() : 0);
            result = 31 * result + (this.snapshotId != null ? this.snapshotId.hashCode() : 0);
            result = 31 * result + (this.tagSpecifications != null ? this.tagSpecifications.hashCode() : 0);
            result = 31 * result + (this.throughput != null ? this.throughput.hashCode() : 0);
            result = 31 * result + (this.volumeInitializationRate != null ? this.volumeInitializationRate.hashCode() : 0);
            result = 31 * result + (this.volumeType != null ? this.volumeType.hashCode() : 0);
            return result;
        }
    }
}
