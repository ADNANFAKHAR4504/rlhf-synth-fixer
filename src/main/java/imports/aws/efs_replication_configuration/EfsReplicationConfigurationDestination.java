package imports.aws.efs_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.148Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsReplicationConfiguration.EfsReplicationConfigurationDestination")
@software.amazon.jsii.Jsii.Proxy(EfsReplicationConfigurationDestination.Jsii$Proxy.class)
public interface EfsReplicationConfigurationDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_replication_configuration#availability_zone_name EfsReplicationConfiguration#availability_zone_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_replication_configuration#file_system_id EfsReplicationConfiguration#file_system_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileSystemId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_replication_configuration#kms_key_id EfsReplicationConfiguration#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_replication_configuration#region EfsReplicationConfiguration#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EfsReplicationConfigurationDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EfsReplicationConfigurationDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EfsReplicationConfigurationDestination> {
        java.lang.String availabilityZoneName;
        java.lang.String fileSystemId;
        java.lang.String kmsKeyId;
        java.lang.String region;

        /**
         * Sets the value of {@link EfsReplicationConfigurationDestination#getAvailabilityZoneName}
         * @param availabilityZoneName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_replication_configuration#availability_zone_name EfsReplicationConfiguration#availability_zone_name}.
         * @return {@code this}
         */
        public Builder availabilityZoneName(java.lang.String availabilityZoneName) {
            this.availabilityZoneName = availabilityZoneName;
            return this;
        }

        /**
         * Sets the value of {@link EfsReplicationConfigurationDestination#getFileSystemId}
         * @param fileSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_replication_configuration#file_system_id EfsReplicationConfiguration#file_system_id}.
         * @return {@code this}
         */
        public Builder fileSystemId(java.lang.String fileSystemId) {
            this.fileSystemId = fileSystemId;
            return this;
        }

        /**
         * Sets the value of {@link EfsReplicationConfigurationDestination#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_replication_configuration#kms_key_id EfsReplicationConfiguration#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link EfsReplicationConfigurationDestination#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_replication_configuration#region EfsReplicationConfiguration#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EfsReplicationConfigurationDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EfsReplicationConfigurationDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EfsReplicationConfigurationDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EfsReplicationConfigurationDestination {
        private final java.lang.String availabilityZoneName;
        private final java.lang.String fileSystemId;
        private final java.lang.String kmsKeyId;
        private final java.lang.String region;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availabilityZoneName = software.amazon.jsii.Kernel.get(this, "availabilityZoneName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileSystemId = software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availabilityZoneName = builder.availabilityZoneName;
            this.fileSystemId = builder.fileSystemId;
            this.kmsKeyId = builder.kmsKeyId;
            this.region = builder.region;
        }

        @Override
        public final java.lang.String getAvailabilityZoneName() {
            return this.availabilityZoneName;
        }

        @Override
        public final java.lang.String getFileSystemId() {
            return this.fileSystemId;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAvailabilityZoneName() != null) {
                data.set("availabilityZoneName", om.valueToTree(this.getAvailabilityZoneName()));
            }
            if (this.getFileSystemId() != null) {
                data.set("fileSystemId", om.valueToTree(this.getFileSystemId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.efsReplicationConfiguration.EfsReplicationConfigurationDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EfsReplicationConfigurationDestination.Jsii$Proxy that = (EfsReplicationConfigurationDestination.Jsii$Proxy) o;

            if (this.availabilityZoneName != null ? !this.availabilityZoneName.equals(that.availabilityZoneName) : that.availabilityZoneName != null) return false;
            if (this.fileSystemId != null ? !this.fileSystemId.equals(that.fileSystemId) : that.fileSystemId != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            return this.region != null ? this.region.equals(that.region) : that.region == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availabilityZoneName != null ? this.availabilityZoneName.hashCode() : 0;
            result = 31 * result + (this.fileSystemId != null ? this.fileSystemId.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            return result;
        }
    }
}
