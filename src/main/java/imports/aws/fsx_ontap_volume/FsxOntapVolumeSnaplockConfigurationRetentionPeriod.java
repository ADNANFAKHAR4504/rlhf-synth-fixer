package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.253Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod")
@software.amazon.jsii.Jsii.Proxy(FsxOntapVolumeSnaplockConfigurationRetentionPeriod.Jsii$Proxy.class)
public interface FsxOntapVolumeSnaplockConfigurationRetentionPeriod extends software.amazon.jsii.JsiiSerializable {

    /**
     * default_retention block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#default_retention FsxOntapVolume#default_retention}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention getDefaultRetention() {
        return null;
    }

    /**
     * maximum_retention block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#maximum_retention FsxOntapVolume#maximum_retention}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention getMaximumRetention() {
        return null;
    }

    /**
     * minimum_retention block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#minimum_retention FsxOntapVolume#minimum_retention}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention getMinimumRetention() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriod}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriod}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOntapVolumeSnaplockConfigurationRetentionPeriod> {
        imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention defaultRetention;
        imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention maximumRetention;
        imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention minimumRetention;

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriod#getDefaultRetention}
         * @param defaultRetention default_retention block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#default_retention FsxOntapVolume#default_retention}
         * @return {@code this}
         */
        public Builder defaultRetention(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention defaultRetention) {
            this.defaultRetention = defaultRetention;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriod#getMaximumRetention}
         * @param maximumRetention maximum_retention block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#maximum_retention FsxOntapVolume#maximum_retention}
         * @return {@code this}
         */
        public Builder maximumRetention(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention maximumRetention) {
            this.maximumRetention = maximumRetention;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriod#getMinimumRetention}
         * @param minimumRetention minimum_retention block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#minimum_retention FsxOntapVolume#minimum_retention}
         * @return {@code this}
         */
        public Builder minimumRetention(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention minimumRetention) {
            this.minimumRetention = minimumRetention;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriod}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOntapVolumeSnaplockConfigurationRetentionPeriod build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriod}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOntapVolumeSnaplockConfigurationRetentionPeriod {
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention defaultRetention;
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention maximumRetention;
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention minimumRetention;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultRetention = software.amazon.jsii.Kernel.get(this, "defaultRetention", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention.class));
            this.maximumRetention = software.amazon.jsii.Kernel.get(this, "maximumRetention", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention.class));
            this.minimumRetention = software.amazon.jsii.Kernel.get(this, "minimumRetention", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultRetention = builder.defaultRetention;
            this.maximumRetention = builder.maximumRetention;
            this.minimumRetention = builder.minimumRetention;
        }

        @Override
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention getDefaultRetention() {
            return this.defaultRetention;
        }

        @Override
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention getMaximumRetention() {
            return this.maximumRetention;
        }

        @Override
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention getMinimumRetention() {
            return this.minimumRetention;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultRetention() != null) {
                data.set("defaultRetention", om.valueToTree(this.getDefaultRetention()));
            }
            if (this.getMaximumRetention() != null) {
                data.set("maximumRetention", om.valueToTree(this.getMaximumRetention()));
            }
            if (this.getMinimumRetention() != null) {
                data.set("minimumRetention", om.valueToTree(this.getMinimumRetention()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOntapVolumeSnaplockConfigurationRetentionPeriod.Jsii$Proxy that = (FsxOntapVolumeSnaplockConfigurationRetentionPeriod.Jsii$Proxy) o;

            if (this.defaultRetention != null ? !this.defaultRetention.equals(that.defaultRetention) : that.defaultRetention != null) return false;
            if (this.maximumRetention != null ? !this.maximumRetention.equals(that.maximumRetention) : that.maximumRetention != null) return false;
            return this.minimumRetention != null ? this.minimumRetention.equals(that.minimumRetention) : that.minimumRetention == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultRetention != null ? this.defaultRetention.hashCode() : 0;
            result = 31 * result + (this.maximumRetention != null ? this.maximumRetention.hashCode() : 0);
            result = 31 * result + (this.minimumRetention != null ? this.minimumRetention.hashCode() : 0);
            return result;
        }
    }
}
