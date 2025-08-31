package imports.aws.imagebuilder_image_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.360Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImageRecipe.ImagebuilderImageRecipeBlockDeviceMappingEbs")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImageRecipeBlockDeviceMappingEbs.Jsii$Proxy.class)
public interface ImagebuilderImageRecipeBlockDeviceMappingEbs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#delete_on_termination ImagebuilderImageRecipe#delete_on_termination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeleteOnTermination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#encrypted ImagebuilderImageRecipe#encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#iops ImagebuilderImageRecipe#iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#kms_key_id ImagebuilderImageRecipe#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#snapshot_id ImagebuilderImageRecipe#snapshot_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#throughput ImagebuilderImageRecipe#throughput}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThroughput() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#volume_size ImagebuilderImageRecipe#volume_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#volume_type ImagebuilderImageRecipe#volume_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImageRecipeBlockDeviceMappingEbs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImageRecipeBlockDeviceMappingEbs> {
        java.lang.String deleteOnTermination;
        java.lang.String encrypted;
        java.lang.Number iops;
        java.lang.String kmsKeyId;
        java.lang.String snapshotId;
        java.lang.Number throughput;
        java.lang.Number volumeSize;
        java.lang.String volumeType;

        /**
         * Sets the value of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs#getDeleteOnTermination}
         * @param deleteOnTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#delete_on_termination ImagebuilderImageRecipe#delete_on_termination}.
         * @return {@code this}
         */
        public Builder deleteOnTermination(java.lang.String deleteOnTermination) {
            this.deleteOnTermination = deleteOnTermination;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#encrypted ImagebuilderImageRecipe#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.String encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs#getIops}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#iops ImagebuilderImageRecipe#iops}.
         * @return {@code this}
         */
        public Builder iops(java.lang.Number iops) {
            this.iops = iops;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#kms_key_id ImagebuilderImageRecipe#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs#getSnapshotId}
         * @param snapshotId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#snapshot_id ImagebuilderImageRecipe#snapshot_id}.
         * @return {@code this}
         */
        public Builder snapshotId(java.lang.String snapshotId) {
            this.snapshotId = snapshotId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs#getThroughput}
         * @param throughput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#throughput ImagebuilderImageRecipe#throughput}.
         * @return {@code this}
         */
        public Builder throughput(java.lang.Number throughput) {
            this.throughput = throughput;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs#getVolumeSize}
         * @param volumeSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#volume_size ImagebuilderImageRecipe#volume_size}.
         * @return {@code this}
         */
        public Builder volumeSize(java.lang.Number volumeSize) {
            this.volumeSize = volumeSize;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs#getVolumeType}
         * @param volumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#volume_type ImagebuilderImageRecipe#volume_type}.
         * @return {@code this}
         */
        public Builder volumeType(java.lang.String volumeType) {
            this.volumeType = volumeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderImageRecipeBlockDeviceMappingEbs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImageRecipeBlockDeviceMappingEbs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImageRecipeBlockDeviceMappingEbs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImageRecipeBlockDeviceMappingEbs {
        private final java.lang.String deleteOnTermination;
        private final java.lang.String encrypted;
        private final java.lang.Number iops;
        private final java.lang.String kmsKeyId;
        private final java.lang.String snapshotId;
        private final java.lang.Number throughput;
        private final java.lang.Number volumeSize;
        private final java.lang.String volumeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deleteOnTermination = software.amazon.jsii.Kernel.get(this, "deleteOnTermination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iops = software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotId = software.amazon.jsii.Kernel.get(this, "snapshotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.throughput = software.amazon.jsii.Kernel.get(this, "throughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.volumeSize = software.amazon.jsii.Kernel.get(this, "volumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.volumeType = software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deleteOnTermination = builder.deleteOnTermination;
            this.encrypted = builder.encrypted;
            this.iops = builder.iops;
            this.kmsKeyId = builder.kmsKeyId;
            this.snapshotId = builder.snapshotId;
            this.throughput = builder.throughput;
            this.volumeSize = builder.volumeSize;
            this.volumeType = builder.volumeType;
        }

        @Override
        public final java.lang.String getDeleteOnTermination() {
            return this.deleteOnTermination;
        }

        @Override
        public final java.lang.String getEncrypted() {
            return this.encrypted;
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
        public final java.lang.String getSnapshotId() {
            return this.snapshotId;
        }

        @Override
        public final java.lang.Number getThroughput() {
            return this.throughput;
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

            if (this.getDeleteOnTermination() != null) {
                data.set("deleteOnTermination", om.valueToTree(this.getDeleteOnTermination()));
            }
            if (this.getEncrypted() != null) {
                data.set("encrypted", om.valueToTree(this.getEncrypted()));
            }
            if (this.getIops() != null) {
                data.set("iops", om.valueToTree(this.getIops()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getSnapshotId() != null) {
                data.set("snapshotId", om.valueToTree(this.getSnapshotId()));
            }
            if (this.getThroughput() != null) {
                data.set("throughput", om.valueToTree(this.getThroughput()));
            }
            if (this.getVolumeSize() != null) {
                data.set("volumeSize", om.valueToTree(this.getVolumeSize()));
            }
            if (this.getVolumeType() != null) {
                data.set("volumeType", om.valueToTree(this.getVolumeType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderImageRecipe.ImagebuilderImageRecipeBlockDeviceMappingEbs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImageRecipeBlockDeviceMappingEbs.Jsii$Proxy that = (ImagebuilderImageRecipeBlockDeviceMappingEbs.Jsii$Proxy) o;

            if (this.deleteOnTermination != null ? !this.deleteOnTermination.equals(that.deleteOnTermination) : that.deleteOnTermination != null) return false;
            if (this.encrypted != null ? !this.encrypted.equals(that.encrypted) : that.encrypted != null) return false;
            if (this.iops != null ? !this.iops.equals(that.iops) : that.iops != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.snapshotId != null ? !this.snapshotId.equals(that.snapshotId) : that.snapshotId != null) return false;
            if (this.throughput != null ? !this.throughput.equals(that.throughput) : that.throughput != null) return false;
            if (this.volumeSize != null ? !this.volumeSize.equals(that.volumeSize) : that.volumeSize != null) return false;
            return this.volumeType != null ? this.volumeType.equals(that.volumeType) : that.volumeType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deleteOnTermination != null ? this.deleteOnTermination.hashCode() : 0;
            result = 31 * result + (this.encrypted != null ? this.encrypted.hashCode() : 0);
            result = 31 * result + (this.iops != null ? this.iops.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.snapshotId != null ? this.snapshotId.hashCode() : 0);
            result = 31 * result + (this.throughput != null ? this.throughput.hashCode() : 0);
            result = 31 * result + (this.volumeSize != null ? this.volumeSize.hashCode() : 0);
            result = 31 * result + (this.volumeType != null ? this.volumeType.hashCode() : 0);
            return result;
        }
    }
}
