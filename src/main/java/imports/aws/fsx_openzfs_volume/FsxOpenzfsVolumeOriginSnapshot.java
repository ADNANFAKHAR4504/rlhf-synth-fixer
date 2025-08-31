package imports.aws.fsx_openzfs_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.257Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOpenzfsVolume.FsxOpenzfsVolumeOriginSnapshot")
@software.amazon.jsii.Jsii.Proxy(FsxOpenzfsVolumeOriginSnapshot.Jsii$Proxy.class)
public interface FsxOpenzfsVolumeOriginSnapshot extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_strategy FsxOpenzfsVolume#copy_strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCopyStrategy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#snapshot_arn FsxOpenzfsVolume#snapshot_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSnapshotArn();

    /**
     * @return a {@link Builder} of {@link FsxOpenzfsVolumeOriginSnapshot}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOpenzfsVolumeOriginSnapshot}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOpenzfsVolumeOriginSnapshot> {
        java.lang.String copyStrategy;
        java.lang.String snapshotArn;

        /**
         * Sets the value of {@link FsxOpenzfsVolumeOriginSnapshot#getCopyStrategy}
         * @param copyStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_strategy FsxOpenzfsVolume#copy_strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder copyStrategy(java.lang.String copyStrategy) {
            this.copyStrategy = copyStrategy;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeOriginSnapshot#getSnapshotArn}
         * @param snapshotArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#snapshot_arn FsxOpenzfsVolume#snapshot_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder snapshotArn(java.lang.String snapshotArn) {
            this.snapshotArn = snapshotArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOpenzfsVolumeOriginSnapshot}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOpenzfsVolumeOriginSnapshot build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOpenzfsVolumeOriginSnapshot}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOpenzfsVolumeOriginSnapshot {
        private final java.lang.String copyStrategy;
        private final java.lang.String snapshotArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.copyStrategy = software.amazon.jsii.Kernel.get(this, "copyStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotArn = software.amazon.jsii.Kernel.get(this, "snapshotArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.copyStrategy = java.util.Objects.requireNonNull(builder.copyStrategy, "copyStrategy is required");
            this.snapshotArn = java.util.Objects.requireNonNull(builder.snapshotArn, "snapshotArn is required");
        }

        @Override
        public final java.lang.String getCopyStrategy() {
            return this.copyStrategy;
        }

        @Override
        public final java.lang.String getSnapshotArn() {
            return this.snapshotArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("copyStrategy", om.valueToTree(this.getCopyStrategy()));
            data.set("snapshotArn", om.valueToTree(this.getSnapshotArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOpenzfsVolume.FsxOpenzfsVolumeOriginSnapshot"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOpenzfsVolumeOriginSnapshot.Jsii$Proxy that = (FsxOpenzfsVolumeOriginSnapshot.Jsii$Proxy) o;

            if (!copyStrategy.equals(that.copyStrategy)) return false;
            return this.snapshotArn.equals(that.snapshotArn);
        }

        @Override
        public final int hashCode() {
            int result = this.copyStrategy.hashCode();
            result = 31 * result + (this.snapshotArn.hashCode());
            return result;
        }
    }
}
