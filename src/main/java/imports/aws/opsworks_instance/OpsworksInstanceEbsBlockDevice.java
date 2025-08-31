package imports.aws.opsworks_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.017Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksInstance.OpsworksInstanceEbsBlockDevice")
@software.amazon.jsii.Jsii.Proxy(OpsworksInstanceEbsBlockDevice.Jsii$Proxy.class)
public interface OpsworksInstanceEbsBlockDevice extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#device_name OpsworksInstance#device_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeviceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_on_termination OpsworksInstance#delete_on_termination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteOnTermination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#iops OpsworksInstance#iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#snapshot_id OpsworksInstance#snapshot_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#volume_size OpsworksInstance#volume_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#volume_type OpsworksInstance#volume_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksInstanceEbsBlockDevice}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksInstanceEbsBlockDevice}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksInstanceEbsBlockDevice> {
        java.lang.String deviceName;
        java.lang.Object deleteOnTermination;
        java.lang.Number iops;
        java.lang.String snapshotId;
        java.lang.Number volumeSize;
        java.lang.String volumeType;

        /**
         * Sets the value of {@link OpsworksInstanceEbsBlockDevice#getDeviceName}
         * @param deviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#device_name OpsworksInstance#device_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deviceName(java.lang.String deviceName) {
            this.deviceName = deviceName;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceEbsBlockDevice#getDeleteOnTermination}
         * @param deleteOnTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_on_termination OpsworksInstance#delete_on_termination}.
         * @return {@code this}
         */
        public Builder deleteOnTermination(java.lang.Boolean deleteOnTermination) {
            this.deleteOnTermination = deleteOnTermination;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceEbsBlockDevice#getDeleteOnTermination}
         * @param deleteOnTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_on_termination OpsworksInstance#delete_on_termination}.
         * @return {@code this}
         */
        public Builder deleteOnTermination(com.hashicorp.cdktf.IResolvable deleteOnTermination) {
            this.deleteOnTermination = deleteOnTermination;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceEbsBlockDevice#getIops}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#iops OpsworksInstance#iops}.
         * @return {@code this}
         */
        public Builder iops(java.lang.Number iops) {
            this.iops = iops;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceEbsBlockDevice#getSnapshotId}
         * @param snapshotId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#snapshot_id OpsworksInstance#snapshot_id}.
         * @return {@code this}
         */
        public Builder snapshotId(java.lang.String snapshotId) {
            this.snapshotId = snapshotId;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceEbsBlockDevice#getVolumeSize}
         * @param volumeSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#volume_size OpsworksInstance#volume_size}.
         * @return {@code this}
         */
        public Builder volumeSize(java.lang.Number volumeSize) {
            this.volumeSize = volumeSize;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceEbsBlockDevice#getVolumeType}
         * @param volumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#volume_type OpsworksInstance#volume_type}.
         * @return {@code this}
         */
        public Builder volumeType(java.lang.String volumeType) {
            this.volumeType = volumeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpsworksInstanceEbsBlockDevice}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksInstanceEbsBlockDevice build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksInstanceEbsBlockDevice}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksInstanceEbsBlockDevice {
        private final java.lang.String deviceName;
        private final java.lang.Object deleteOnTermination;
        private final java.lang.Number iops;
        private final java.lang.String snapshotId;
        private final java.lang.Number volumeSize;
        private final java.lang.String volumeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceName = software.amazon.jsii.Kernel.get(this, "deviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteOnTermination = software.amazon.jsii.Kernel.get(this, "deleteOnTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iops = software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.snapshotId = software.amazon.jsii.Kernel.get(this, "snapshotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.volumeSize = software.amazon.jsii.Kernel.get(this, "volumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.volumeType = software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceName = java.util.Objects.requireNonNull(builder.deviceName, "deviceName is required");
            this.deleteOnTermination = builder.deleteOnTermination;
            this.iops = builder.iops;
            this.snapshotId = builder.snapshotId;
            this.volumeSize = builder.volumeSize;
            this.volumeType = builder.volumeType;
        }

        @Override
        public final java.lang.String getDeviceName() {
            return this.deviceName;
        }

        @Override
        public final java.lang.Object getDeleteOnTermination() {
            return this.deleteOnTermination;
        }

        @Override
        public final java.lang.Number getIops() {
            return this.iops;
        }

        @Override
        public final java.lang.String getSnapshotId() {
            return this.snapshotId;
        }

        @Override
        public final java.lang.Number getVolumeSize() {
            return this.volumeSize;
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

            data.set("deviceName", om.valueToTree(this.getDeviceName()));
            if (this.getDeleteOnTermination() != null) {
                data.set("deleteOnTermination", om.valueToTree(this.getDeleteOnTermination()));
            }
            if (this.getIops() != null) {
                data.set("iops", om.valueToTree(this.getIops()));
            }
            if (this.getSnapshotId() != null) {
                data.set("snapshotId", om.valueToTree(this.getSnapshotId()));
            }
            if (this.getVolumeSize() != null) {
                data.set("volumeSize", om.valueToTree(this.getVolumeSize()));
            }
            if (this.getVolumeType() != null) {
                data.set("volumeType", om.valueToTree(this.getVolumeType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opsworksInstance.OpsworksInstanceEbsBlockDevice"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksInstanceEbsBlockDevice.Jsii$Proxy that = (OpsworksInstanceEbsBlockDevice.Jsii$Proxy) o;

            if (!deviceName.equals(that.deviceName)) return false;
            if (this.deleteOnTermination != null ? !this.deleteOnTermination.equals(that.deleteOnTermination) : that.deleteOnTermination != null) return false;
            if (this.iops != null ? !this.iops.equals(that.iops) : that.iops != null) return false;
            if (this.snapshotId != null ? !this.snapshotId.equals(that.snapshotId) : that.snapshotId != null) return false;
            if (this.volumeSize != null ? !this.volumeSize.equals(that.volumeSize) : that.volumeSize != null) return false;
            return this.volumeType != null ? this.volumeType.equals(that.volumeType) : that.volumeType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deviceName.hashCode();
            result = 31 * result + (this.deleteOnTermination != null ? this.deleteOnTermination.hashCode() : 0);
            result = 31 * result + (this.iops != null ? this.iops.hashCode() : 0);
            result = 31 * result + (this.snapshotId != null ? this.snapshotId.hashCode() : 0);
            result = 31 * result + (this.volumeSize != null ? this.volumeSize.hashCode() : 0);
            result = 31 * result + (this.volumeType != null ? this.volumeType.hashCode() : 0);
            return result;
        }
    }
}
