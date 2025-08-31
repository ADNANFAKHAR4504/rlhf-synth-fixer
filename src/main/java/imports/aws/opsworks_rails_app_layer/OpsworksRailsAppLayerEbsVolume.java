package imports.aws.opsworks_rails_app_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.038Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksRailsAppLayer.OpsworksRailsAppLayerEbsVolume")
@software.amazon.jsii.Jsii.Proxy(OpsworksRailsAppLayerEbsVolume.Jsii$Proxy.class)
public interface OpsworksRailsAppLayerEbsVolume extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#mount_point OpsworksRailsAppLayer#mount_point}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMountPoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#number_of_disks OpsworksRailsAppLayer#number_of_disks}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfDisks();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#size OpsworksRailsAppLayer#size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#encrypted OpsworksRailsAppLayer#encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#iops OpsworksRailsAppLayer#iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#raid_level OpsworksRailsAppLayer#raid_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRaidLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#type OpsworksRailsAppLayer#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksRailsAppLayerEbsVolume}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksRailsAppLayerEbsVolume}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksRailsAppLayerEbsVolume> {
        java.lang.String mountPoint;
        java.lang.Number numberOfDisks;
        java.lang.Number size;
        java.lang.Object encrypted;
        java.lang.Number iops;
        java.lang.String raidLevel;
        java.lang.String type;

        /**
         * Sets the value of {@link OpsworksRailsAppLayerEbsVolume#getMountPoint}
         * @param mountPoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#mount_point OpsworksRailsAppLayer#mount_point}. This parameter is required.
         * @return {@code this}
         */
        public Builder mountPoint(java.lang.String mountPoint) {
            this.mountPoint = mountPoint;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerEbsVolume#getNumberOfDisks}
         * @param numberOfDisks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#number_of_disks OpsworksRailsAppLayer#number_of_disks}. This parameter is required.
         * @return {@code this}
         */
        public Builder numberOfDisks(java.lang.Number numberOfDisks) {
            this.numberOfDisks = numberOfDisks;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerEbsVolume#getSize}
         * @param size Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#size OpsworksRailsAppLayer#size}. This parameter is required.
         * @return {@code this}
         */
        public Builder size(java.lang.Number size) {
            this.size = size;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerEbsVolume#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#encrypted OpsworksRailsAppLayer#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.Boolean encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerEbsVolume#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#encrypted OpsworksRailsAppLayer#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(com.hashicorp.cdktf.IResolvable encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerEbsVolume#getIops}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#iops OpsworksRailsAppLayer#iops}.
         * @return {@code this}
         */
        public Builder iops(java.lang.Number iops) {
            this.iops = iops;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerEbsVolume#getRaidLevel}
         * @param raidLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#raid_level OpsworksRailsAppLayer#raid_level}.
         * @return {@code this}
         */
        public Builder raidLevel(java.lang.String raidLevel) {
            this.raidLevel = raidLevel;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerEbsVolume#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#type OpsworksRailsAppLayer#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpsworksRailsAppLayerEbsVolume}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksRailsAppLayerEbsVolume build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksRailsAppLayerEbsVolume}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksRailsAppLayerEbsVolume {
        private final java.lang.String mountPoint;
        private final java.lang.Number numberOfDisks;
        private final java.lang.Number size;
        private final java.lang.Object encrypted;
        private final java.lang.Number iops;
        private final java.lang.String raidLevel;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mountPoint = software.amazon.jsii.Kernel.get(this, "mountPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numberOfDisks = software.amazon.jsii.Kernel.get(this, "numberOfDisks", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.size = software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iops = software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.raidLevel = software.amazon.jsii.Kernel.get(this, "raidLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mountPoint = java.util.Objects.requireNonNull(builder.mountPoint, "mountPoint is required");
            this.numberOfDisks = java.util.Objects.requireNonNull(builder.numberOfDisks, "numberOfDisks is required");
            this.size = java.util.Objects.requireNonNull(builder.size, "size is required");
            this.encrypted = builder.encrypted;
            this.iops = builder.iops;
            this.raidLevel = builder.raidLevel;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getMountPoint() {
            return this.mountPoint;
        }

        @Override
        public final java.lang.Number getNumberOfDisks() {
            return this.numberOfDisks;
        }

        @Override
        public final java.lang.Number getSize() {
            return this.size;
        }

        @Override
        public final java.lang.Object getEncrypted() {
            return this.encrypted;
        }

        @Override
        public final java.lang.Number getIops() {
            return this.iops;
        }

        @Override
        public final java.lang.String getRaidLevel() {
            return this.raidLevel;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mountPoint", om.valueToTree(this.getMountPoint()));
            data.set("numberOfDisks", om.valueToTree(this.getNumberOfDisks()));
            data.set("size", om.valueToTree(this.getSize()));
            if (this.getEncrypted() != null) {
                data.set("encrypted", om.valueToTree(this.getEncrypted()));
            }
            if (this.getIops() != null) {
                data.set("iops", om.valueToTree(this.getIops()));
            }
            if (this.getRaidLevel() != null) {
                data.set("raidLevel", om.valueToTree(this.getRaidLevel()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opsworksRailsAppLayer.OpsworksRailsAppLayerEbsVolume"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksRailsAppLayerEbsVolume.Jsii$Proxy that = (OpsworksRailsAppLayerEbsVolume.Jsii$Proxy) o;

            if (!mountPoint.equals(that.mountPoint)) return false;
            if (!numberOfDisks.equals(that.numberOfDisks)) return false;
            if (!size.equals(that.size)) return false;
            if (this.encrypted != null ? !this.encrypted.equals(that.encrypted) : that.encrypted != null) return false;
            if (this.iops != null ? !this.iops.equals(that.iops) : that.iops != null) return false;
            if (this.raidLevel != null ? !this.raidLevel.equals(that.raidLevel) : that.raidLevel != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mountPoint.hashCode();
            result = 31 * result + (this.numberOfDisks.hashCode());
            result = 31 * result + (this.size.hashCode());
            result = 31 * result + (this.encrypted != null ? this.encrypted.hashCode() : 0);
            result = 31 * result + (this.iops != null ? this.iops.hashCode() : 0);
            result = 31 * result + (this.raidLevel != null ? this.raidLevel.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
