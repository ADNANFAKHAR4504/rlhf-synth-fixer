package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.253Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention")
@software.amazon.jsii.Jsii.Proxy(FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention.Jsii$Proxy.class)
public interface FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention> {
        java.lang.String type;
        java.lang.Number value;

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#type FsxOntapVolume#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#value FsxOntapVolume#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.Number value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention {
        private final java.lang.String type;
        private final java.lang.Number value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = builder.type;
            this.value = builder.value;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Number getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention.Jsii$Proxy that = (FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention.Jsii$Proxy) o;

            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type != null ? this.type.hashCode() : 0;
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
